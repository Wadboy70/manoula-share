-- Enriched search view: include resolved specialty label per service in the services JSON aggregate.

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
          'specialty_label', svc_spec.label
        ) order by sv.title asc, sv.id asc
      )
      from public.services sv
      left join public.specialties svc_spec
        on svc_spec.id = sv.specialty_id
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
