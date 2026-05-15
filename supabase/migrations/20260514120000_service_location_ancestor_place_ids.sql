-- Geoapify ancestor place ids on service location rows for hierarchical search matching
-- (e.g. user searches "London" city id; provider row stores street id with London in ancestors).

drop view if exists public.professional_search_cards_enriched;

alter table public.service_provider_locations
  add column if not exists ancestor_place_ids text[] not null default '{}'::text[];

alter table public.service_area_places
  add column if not exists ancestor_place_ids text[] not null default '{}'::text[];

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
        and (
          spl.place_id = any (user_ids)
          or p_user_place_id = any (coalesce(spl.ancestor_place_ids, array[]::text[]))
          or user_ids && coalesce(spl.ancestor_place_ids, array[]::text[])
        )
    );
  end if;

  if sv.delivery_mode = 'in_home' then
    if sv.service_area_type = 'place_list' then
      return exists (
        select 1
        from public.service_area_places sap
        where sap.service_id = p_service_id
          and sap.place_id is not null
          and (
            sap.place_id = any (user_ids)
            or p_user_place_id = any (coalesce(sap.ancestor_place_ids, array[]::text[]))
            or user_ids && coalesce(sap.ancestor_place_ids, array[]::text[])
          )
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
            'longitude', spl.longitude,
            'ancestor_place_ids', coalesce(to_jsonb(spl.ancestor_place_ids), '[]'::jsonb)
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
            'longitude', sap.longitude,
            'ancestor_place_ids', coalesce(to_jsonb(sap.ancestor_place_ids), '[]'::jsonb)
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
