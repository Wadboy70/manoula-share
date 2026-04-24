-- Remove hybrid delivery mode: split into remote + in-person rows, tighten CHECK constraint.

-- 1) Remote clone for each hybrid service (same pro/specialty/pricing; remote_scope anywhere).
insert into public.services (
  professional_id,
  specialty_id,
  title,
  description,
  price_cents,
  currency_code,
  duration_minutes,
  delivery_mode,
  remote_scope,
  provider_location_name,
  service_area_type,
  service_radius_km,
  service_area_text,
  is_active
)
select
  professional_id,
  specialty_id,
  regexp_replace(title, '\s*\(hybrid\)\s*$', '', 'i') || ' (remote)',
  description,
  price_cents,
  currency_code,
  duration_minutes,
  'remote'::text,
  'anywhere'::text,
  null::text,
  null::text,
  null::numeric(6, 2),
  null::text,
  is_active
from public.services
where delivery_mode = 'hybrid';

-- 2) Original hybrid rows become in_home; keep service_area_places / provider_locations FKs.
update public.services
set
  delivery_mode = 'in_home',
  title = regexp_replace(title, '\s*\(hybrid\)\s*$', '', 'i'),
  remote_scope = null
where delivery_mode = 'hybrid';

-- 3) Replace CHECK constraint (no hybrid).
alter table public.services drop constraint if exists services_delivery_mode_check;

alter table public.services
  add constraint services_delivery_mode_check check (
    delivery_mode in ('remote', 'in_home', 'provider_location')
  );
