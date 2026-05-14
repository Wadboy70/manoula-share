-- Geoapify: remove mapbox_id, add place_id, and refresh search RPC/view (from 20260430103000 baseline).
-- Historical migration files are not modified.

drop view if exists public.professional_search_cards_enriched;

alter table public.professional_search_profiles
  drop constraint if exists professional_search_profiles_mapbox_id_len;

alter table public.professional_search_profiles
  add column if not exists place_id text;

alter table public.service_provider_locations
  add column if not exists place_id text;

alter table public.service_area_places
  add column if not exists place_id text;

-- PostgreSQL: CREATE OR REPLACE cannot rename parameters (42P13); must drop first.
drop function if exists public.search_service_matches_location(
  bigint,
  text,
  double precision,
  double precision,
  text[],
  double precision,
  double precision
);

create function public.search_service_matches_location(
  p_service_id bigint,
  p_user_place_id text,
  p_user_lat double precision,
  p_user_lng double precision,
  p_ancestor_place_ids text[],
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
    array[p_user_place_id]::text[],
    coalesce(p_ancestor_place_ids, array[]::text[])
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
        and spl.place_id is not null
        and spl.place_id = any (user_ids)
    );
  end if;

  if sv.delivery_mode = 'in_home' then
    if sv.service_area_type = 'place_list' then
      return exists (
        select 1
        from public.service_area_places sap
        where sap.service_id = p_service_id
          and sap.place_id is not null
          and sap.place_id = any (user_ids)
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

revoke all on function public.search_service_matches_location(
  bigint, text, double precision, double precision, text[], double precision, double precision
) from public;
grant execute on function public.search_service_matches_location(
  bigint, text, double precision, double precision, text[], double precision, double precision
) to anon, authenticated, service_role;

create or replace function public.upsert_professional_profile(
  p_payload jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $$
declare
  v_professional_id bigint := public.app_user_id_for_auth();
  v_is_professional boolean := false;
  v_first_name text;
  v_last_name text;
  v_bio text;
  v_profile_photo_url text;
  v_location_label text;
  v_place_id text;
  v_country_code text;
  v_is_public_searchable boolean := false;
  v_is_profile_complete boolean := false;
begin
  if v_professional_id is null then
    raise exception 'unauthorized';
  end if;

  select coalesce(u.is_professional, false)
    into v_is_professional
  from public.users u
  where u.id = v_professional_id;

  if not v_is_professional then
    raise exception 'forbidden';
  end if;

  v_first_name := nullif(
    left(regexp_replace(coalesce(p_payload ->> 'firstName', ''), '<[^>]*>', '', 'g'), 80),
    ''
  );
  v_last_name := nullif(
    left(regexp_replace(coalesce(p_payload ->> 'lastName', ''), '<[^>]*>', '', 'g'), 80),
    ''
  );
  v_bio := nullif(
    left(regexp_replace(coalesce(p_payload ->> 'bio', ''), '<[^>]*>', '', 'g'), 1500),
    ''
  );
  v_profile_photo_url := nullif(
    left(regexp_replace(coalesce(p_payload ->> 'profilePhotoUrl', ''), '<[^>]*>', '', 'g'), 2048),
    ''
  );
  v_location_label := nullif(
    left(regexp_replace(coalesce(p_payload ->> 'locationLabel', ''), '<[^>]*>', '', 'g'), 160),
    ''
  );
  v_place_id := nullif(
    btrim(regexp_replace(coalesce(p_payload ->> 'placeId', ''), '<[^>]*>', '', 'g')),
    ''
  );
  v_country_code := coalesce(nullif(btrim(p_payload ->> 'countryCode'), ''), 'GB');
  v_is_public_searchable := coalesce((p_payload ->> 'isPublicSearchable')::boolean, false);
  v_is_profile_complete := coalesce((p_payload ->> 'isProfileComplete')::boolean, false);

  update public.users
  set
    first_name = v_first_name,
    last_name = v_last_name,
    bio = v_bio,
    profile_photo_url = v_profile_photo_url
  where id = v_professional_id;

  update public.professional_search_profiles
  set
    location_label = v_location_label,
    place_id = v_place_id,
    country_code = v_country_code,
    is_public_searchable = v_is_public_searchable,
    is_profile_complete = v_is_profile_complete
  where user_id = v_professional_id;

  return jsonb_build_object(
    'ok',
    true,
    'professionalId',
    v_professional_id
  );
end;
$$;

revoke all on function public.upsert_professional_profile(jsonb) from public;
grant execute on function public.upsert_professional_profile(jsonb) to authenticated;

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
  p.place_id,
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
            'place_id', spl.place_id,
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
            'place_id', sap.place_id,
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
  p.place_id,
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
  v_place_id text;
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
    v_place_id := nullif(trim(p_location ->> 'placeId'), '');
    v_lat := (p_location ->> 'latitude')::double precision;
    v_lng := (p_location ->> 'longitude')::double precision;
    v_country_code := upper(nullif(trim(p_location ->> 'countryCode'), ''));
    select coalesce(array_agg(elem), array[]::text[])
    into v_ancestors
    from jsonb_array_elements_text(coalesce(p_location -> 'ancestorPlaceIds', '[]'::jsonb)) as t(elem);
  end if;

  if p_location is not null and (v_place_id is null or v_lat is null or v_lng is null) then
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
        p.place_id,
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
                v_place_id is null
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
                    v_place_id,
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
              v_place_id is null
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
                  v_place_id,
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
      place_id,
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
      'placeId', r.place_id,
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

alter table public.professional_search_profiles
  drop column if exists mapbox_id;

alter table public.service_provider_locations
  drop column if exists mapbox_id;

alter table public.service_area_places
  drop column if exists mapbox_id;
