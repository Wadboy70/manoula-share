-- Haversine (km) for in_home radius vs user point.
create or replace function public.search_haversine_km(
  lat1 double precision,
  lon1 double precision,
  lat2 double precision,
  lon2 double precision
)
returns double precision
language sql
immutable
parallel safe
as $$
  select
    case
      when lat1 is null or lon1 is null or lat2 is null or lon2 is null then null::double precision
      else
        6371.0 * 2.0 * asin(
          least(
            1.0::double precision,
            sqrt(
              power(sin(radians((lat2 - lat1) / 2.0)), 2)
              + cos(radians(lat1)) * cos(radians(lat2))
              * power(sin(radians((lon2 - lon1) / 2.0)), 2)
            )
          )
        )
    end
$$;

-- Location filter for one service (mirrors search-cards edge logic; hybrid removed).
create or replace function public.search_service_matches_location(
  p_service_id bigint,
  p_user_mapbox_id text,
  p_user_lat double precision,
  p_user_lng double precision,
  p_ancestor_mapbox_ids text[],
  p_profile_lat double precision,
  p_profile_lng double precision
)
returns boolean
language plpgsql
stable
parallel safe
set search_path = public
as $$
declare
  sv record;
  user_ids text[];
  dist double precision;
begin
  user_ids := array_cat(
    array[p_user_mapbox_id]::text[],
    coalesce(p_ancestor_mapbox_ids, array[]::text[])
  );

  select
    s.delivery_mode,
    s.service_area_type,
    s.service_radius_km
  into sv
  from public.services s
  where s.id = p_service_id;

  if not found then
    return false;
  end if;

  if sv.delivery_mode = 'remote' then
    return true;
  end if;

  if sv.delivery_mode = 'provider_location' then
    return exists (
      select 1
      from public.service_provider_locations spl
      where spl.service_id = p_service_id
        and spl.mapbox_id is not null
        and spl.mapbox_id = any (user_ids)
    );
  end if;

  if sv.delivery_mode = 'in_home' then
    if sv.service_area_type = 'place_list' then
      return exists (
        select 1
        from public.service_area_places sap
        where sap.service_id = p_service_id
          and sap.mapbox_id is not null
          and sap.mapbox_id = any (user_ids)
      );
    elsif sv.service_area_type = 'radius' then
      if sv.service_radius_km is null or sv.service_radius_km <= 0 then
        return false;
      end if;
      if p_profile_lat is null or p_profile_lng is null then
        return false;
      end if;
      dist := public.search_haversine_km(p_profile_lat, p_profile_lng, p_user_lat, p_user_lng);
      if dist is null then
        return false;
      end if;
      return dist <= sv.service_radius_km;
    else
      return false;
    end if;
  end if;

  return false;
end;
$$;

revoke all on function public.search_haversine_km(double precision, double precision, double precision, double precision)
  from public;
grant execute on function public.search_haversine_km(double precision, double precision, double precision, double precision)
  to anon, authenticated, service_role;

revoke all on function public.search_service_matches_location(
  bigint, text, double precision, double precision, text[], double precision, double precision
) from public;
grant execute on function public.search_service_matches_location(
  bigint, text, double precision, double precision, text[], double precision, double precision
) to anon, authenticated, service_role;

-- Enriched view: include rating columns for clients that still read the view.
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
  p.offers_remote,
  p.offers_in_home,
  p.offers_provider_location,
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
  p.offers_remote,
  p.offers_in_home,
  p.offers_provider_location,
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
        p.offers_remote,
        p.offers_in_home,
        p.offers_provider_location,
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
                or public.search_service_matches_location(
                  sv.id,
                  v_mapbox,
                  v_lat,
                  v_lng,
                  v_ancestors,
                  p.latitude,
                  p.longitude
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
              or public.search_service_matches_location(
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
      offers_remote,
      offers_in_home,
      offers_provider_location,
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
      'offersRemote', coalesce(r.offers_remote, false),
      'offersInHome', coalesce(r.offers_in_home, false),
      'offersProviderLocation', coalesce(r.offers_provider_location, false),
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

create index if not exists professional_search_profiles_list_sort_idx
  on public.professional_search_profiles (
    (
      case
        when coalesce(rating_count, 0) = 0 then 0::numeric
        else (coalesce(rating_avg, 0::numeric) * rating_count + 4.2 * 10) / (rating_count + 10)
      end
    ) desc,
    user_id asc
  )
  where
    is_public_searchable = true
    and is_active = true
    and is_approved = true
    and is_profile_complete = true;
