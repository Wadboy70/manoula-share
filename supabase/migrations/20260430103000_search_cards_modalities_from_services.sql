-- Delivery modality lozenges are derived client-side from the `services` JSON on each card.
-- Drop denormalized profile flags from the enriched view and search RPC payload.

drop view if exists public.professional_search_cards_enriched;

create view public.professional_search_cards_enriched
with (security_invoker = true) as
select
  u.id as professional_id,
  u.first_name,
  u.last_name,
  u.profile_photo_url,
  u.bio,
  p.country_code,
  p.location_label,
  p.mapbox_id,
  p.latitude,
  p.longitude,
  p.rating_avg,
  p.rating_count,
  coalesce(
    array_agg(distinct spec.label) filter (where spec.label is not null),
    array[]::text[]
  ) as specialties,
  coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', sv.id,
          'title', sv.title,
          'delivery_mode', sv.delivery_mode,
          'price_cents', sv.price_cents,
          'currency_code', sv.currency_code,
          'specialty_label', svc_spec.label,
          'service_area_type', sv.service_area_type,
          'service_radius_km', sv.service_radius_km,
          'provider_locations', coalesce(pl_agg.locations, '[]'::jsonb),
          'service_area_places', coalesce(sap_agg.places, '[]'::jsonb)
        ) order by sv.title asc, sv.id asc
      )
      from public.services sv
      left join public.specialties svc_spec
        on svc_spec.id = sv.specialty_id
      left join lateral (
        select jsonb_agg(
          jsonb_build_object(
            'mapbox_id', spl.mapbox_id,
            'latitude', spl.latitude,
            'longitude', spl.longitude
          ) order by spl.id asc
        ) as locations
        from public.service_provider_locations spl
        where spl.service_id = sv.id
      ) pl_agg on true
      left join lateral (
        select jsonb_agg(
          jsonb_build_object(
            'mapbox_id', sap.mapbox_id,
            'latitude', sap.latitude,
            'longitude', sap.longitude
          ) order by sap.id asc
        ) as places
        from public.service_area_places sap
        where sap.service_id = sv.id
      ) sap_agg on true
      where sv.professional_id = u.id
        and sv.is_active = true
    ),
    '[]'::jsonb
  ) as services
from public.users u
inner join public.professional_search_profiles p
  on p.user_id = u.id
left join public.professional_specialties ps
  on ps.professional_id = u.id
left join public.specialties spec
  on spec.id = ps.specialty_id
where coalesce(u.is_professional, false) = true
  and p.is_profile_complete = true
  and p.is_public_searchable = true
  and p.is_active = true
  and p.is_approved = true
group by
  u.id,
  u.first_name,
  u.last_name,
  u.profile_photo_url,
  u.bio,
  p.country_code,
  p.location_label,
  p.mapbox_id,
  p.latitude,
  p.longitude,
  p.rating_avg,
  p.rating_count;

grant select on public.professional_search_cards_enriched to anon, authenticated;

create or replace function public.search_professional_cards_page(
  p_return_cap integer,
  p_probe_rows integer,
  p_after_sort_score numeric,
  p_after_professional_id bigint,
  p_specialty_label text,
  p_delivery_mode text,
  p_location jsonb
)
returns jsonb
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  v_cap int := least(greatest(coalesce(p_return_cap, 10), 1), 50);
  v_probe int := greatest(least(coalesce(p_probe_rows, 1), 5), 0);
  v_fetch int := v_cap + v_probe;
  v_mapbox text;
  v_lat double precision;
  v_lng double precision;
  v_country_code text;
  v_ancestors text[];
  v_rows jsonb := '[]'::jsonb;
  v_next jsonb := 'null'::jsonb;
  v_sort numeric;
  v_pid bigint;
  r record;
  n int := 0;
  v_card jsonb;
begin
  if p_location is not null and jsonb_typeof(p_location) = 'object' then
    v_mapbox := nullif(trim(p_location ->> 'mapboxId'), '');
    v_lat := (p_location ->> 'latitude')::double precision;
    v_lng := (p_location ->> 'longitude')::double precision;
    v_country_code := upper(nullif(trim(p_location ->> 'countryCode'), ''));
    select coalesce(array_agg(elem), array[]::text[])
    into v_ancestors
    from jsonb_array_elements_text(coalesce(p_location -> 'ancestorMapboxIds', '[]'::jsonb)) as t(elem);
  end if;

  if p_location is not null and (v_mapbox is null or v_lat is null or v_lng is null) then
    return jsonb_build_object(
      'error', 'invalid_location',
      'cards', '[]'::jsonb,
      'nextCursor', null
    );
  end if;

  if p_delivery_mode is not null
    and p_delivery_mode not in ('remote', 'in_home', 'provider_location') then
    return jsonb_build_object(
      'error', 'invalid_delivery_mode',
      'cards', '[]'::jsonb,
      'nextCursor', null
    );
  end if;

  for r in
    with cand as (
      select
        u.id as professional_id,
        u.first_name,
        u.last_name,
        u.profile_photo_url,
        p.country_code,
        p.location_label,
        p.mapbox_id,
        p.latitude,
        p.longitude,
        p.rating_avg,
        p.rating_count,
        case
          when coalesce(p.rating_count, 0) = 0 then 0::numeric
          else
            (coalesce(p.rating_avg, 0::numeric) * p.rating_count + 4.2 * 10)
            / (p.rating_count + 10)
        end as sort_score,
        (
          select jsonb_agg(x.obj order by x.t asc, x.i asc)
          from (
            select
              jsonb_build_object(
                'id', sv.id,
                'title', sv.title,
                'deliveryMode', sv.delivery_mode,
                'priceCents', sv.price_cents,
                'currencyCode', sv.currency_code,
                'specialtyLabel', svc_spec.label
              ) as obj,
              sv.title as t,
              sv.id as i
            from public.services sv
            left join public.specialties svc_spec
              on svc_spec.id = sv.specialty_id
            where sv.professional_id = u.id
              and sv.is_active = true
              and (
                p_specialty_label is null
                or svc_spec.label = p_specialty_label
              )
              and (
                p_delivery_mode is null
                or sv.delivery_mode = p_delivery_mode
              )
              and (
                v_mapbox is null
                or (
                  sv.delivery_mode = 'remote'
                  and (
                    coalesce(sv.remote_scope, 'anywhere') = 'anywhere'
                    or (
                      sv.remote_scope = 'country'
                      and v_country_code is not null
                      and upper(p.country_code) = v_country_code
                    )
                  )
                )
                or (
                  sv.delivery_mode <> 'remote'
                  and public.search_service_matches_location(
                    sv.id,
                    v_mapbox,
                    v_lat,
                    v_lng,
                    v_ancestors,
                    p.latitude,
                    p.longitude
                  )
                )
              )
          ) x
        ) as services_json
      from public.users u
      inner join public.professional_search_profiles p
        on p.user_id = u.id
      where coalesce(u.is_professional, false) = true
        and p.is_profile_complete = true
        and p.is_public_searchable = true
        and p.is_active = true
        and p.is_approved = true
        and exists (
          select 1
          from public.services sv2
          left join public.specialties sp2 on sp2.id = sv2.specialty_id
          where sv2.professional_id = u.id
            and sv2.is_active = true
            and (p_specialty_label is null or sp2.label = p_specialty_label)
            and (p_delivery_mode is null or sv2.delivery_mode = p_delivery_mode)
            and (
              v_mapbox is null
              or (
                sv2.delivery_mode = 'remote'
                and (
                  coalesce(sv2.remote_scope, 'anywhere') = 'anywhere'
                  or (
                    sv2.remote_scope = 'country'
                    and v_country_code is not null
                    and upper(p.country_code) = v_country_code
                  )
                )
              )
              or (
                sv2.delivery_mode <> 'remote'
                and public.search_service_matches_location(
                  sv2.id,
                  v_mapbox,
                  v_lat,
                  v_lng,
                  v_ancestors,
                  p.latitude,
                  p.longitude
                )
              )
            )
        )
    ),
    spec_agg as (
      select
        ps.professional_id,
        coalesce(
          array_agg(distinct s.label) filter (where s.label is not null),
          array[]::text[]
        ) as specialties
      from public.professional_specialties ps
      inner join public.specialties s on s.id = ps.specialty_id
      group by ps.professional_id
    ),
    ranked as (
      select
        c.*,
        coalesce(sa.specialties, array[]::text[]) as specialties_arr
      from cand c
      left join spec_agg sa on sa.professional_id = c.professional_id
      where
        c.services_json is not null
        and jsonb_array_length(c.services_json) >= 1
        and (
          p_after_sort_score is null
          or p_after_professional_id is null
          or (
            c.sort_score < p_after_sort_score
            or (
              c.sort_score = p_after_sort_score
              and c.professional_id > p_after_professional_id
            )
          )
        )
    )
    select
      professional_id,
      first_name,
      last_name,
      profile_photo_url,
      country_code,
      location_label,
      mapbox_id,
      latitude,
      longitude,
      rating_avg,
      rating_count,
      sort_score,
      services_json,
      specialties_arr
    from ranked
    order by sort_score desc, professional_id asc
    limit v_fetch
  loop
    n := n + 1;
    if n > v_fetch then
      exit;
    end if;

    v_card := jsonb_build_object(
      'professionalId', r.professional_id,
      'firstName', r.first_name,
      'lastName', r.last_name,
      'profilePhotoUrl', r.profile_photo_url,
      'countryCode', r.country_code,
      'locationLabel', r.location_label,
      'mapboxId', r.mapbox_id,
      'latitude', r.latitude,
      'longitude', r.longitude,
      'ratingAvg', r.rating_avg,
      'ratingCount', coalesce(r.rating_count, 0),
      'specialties', to_jsonb(coalesce(r.specialties_arr, array[]::text[])),
      'services', r.services_json
    );

    if n <= v_cap then
      v_rows := v_rows || jsonb_build_array(v_card);
    end if;

    if n = v_cap then
      v_sort := r.sort_score;
      v_pid := r.professional_id;
    end if;
  end loop;

  if n > v_cap then
    v_next := jsonb_build_object(
      'sortScore', v_sort,
      'professionalId', v_pid
    );
  else
    v_next := null;
  end if;

  return jsonb_build_object(
    'cards', v_rows,
    'nextCursor', v_next,
    'rowsRead', n
  );
end;
$$;

revoke all on function public.search_professional_cards_page(
  integer, integer, numeric, bigint, text, text, jsonb
) from public;
grant execute on function public.search_professional_cards_page(
  integer, integer, numeric, bigint, text, text, jsonb
) to anon, authenticated, service_role;
