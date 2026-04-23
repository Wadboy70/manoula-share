-- Enriched search view: include per-service geo for location-filtered search (place_list, radius, provider_location).

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
  p.offers_provider_location;

grant select on public.professional_search_cards_enriched to anon, authenticated;
