-- Professional search profiles: move search/location/visibility off public.users,
-- replace professional_search_cards_enriched join, update RLS, drop legacy columns.

-- 1) Table
create table if not exists public.professional_search_profiles (
  user_id bigint not null
    references public.users (id) on delete cascade,
  is_profile_complete boolean not null default false,
  is_public_searchable boolean not null default false,
  is_active boolean not null default true,
  is_approved boolean not null default false,
  country_code text not null default 'GB',
  location_input_text text,
  location_label text,
  mapbox_id text,
  latitude double precision,
  longitude double precision,
  service_radius_km numeric(6, 2),
  geocoded_at timestamp with time zone,
  constraint professional_search_profiles_pkey primary key (user_id)
);

comment on table public.professional_search_profiles is
  'Professional-only search visibility, location, and geo fields (separate from core users).';

alter table public.professional_search_profiles enable row level security;

grant select on table public.professional_search_profiles to anon, authenticated;
grant insert, update on table public.professional_search_profiles to authenticated;

-- 2) Backfill from existing users (before columns are dropped)
insert into public.professional_search_profiles (
  user_id,
  is_profile_complete,
  is_public_searchable,
  is_active,
  is_approved,
  country_code,
  location_input_text,
  location_label,
  mapbox_id,
  latitude,
  longitude,
  service_radius_km,
  geocoded_at
)
select
  u.id,
  coalesce(u.is_profile_complete, false),
  u.is_public_searchable,
  coalesce(u.is_searchable, false),
  case
    when coalesce(u.is_searchable, false) and u.is_public_searchable then true
    else false
  end,
  u.country_code,
  nullif(
    trim(
      both ' ' from concat_ws(
        ' ',
        nullif(trim(u.location_locality), ''),
        nullif(trim(u.location_region), ''),
        nullif(trim(u.postal_code), '')
      )
    ),
    ''
  ),
  coalesce(
    nullif(trim(u.service_area), ''),
    nullif(
      trim(
        both ' ' from concat_ws(
          ', ',
          nullif(trim(u.location_locality), ''),
          nullif(trim(u.location_region), '')
        )
      ),
      ''
    )
  ),
  null,
  null,
  null,
  null,
  null
from public.users u
where coalesce(u.is_professional, false) = true
on conflict (user_id) do nothing;

-- 3) Ensure a profile row exists when someone is (or becomes) a professional
create or replace function public.ensure_professional_search_profile_for_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.is_professional, false) is true then
    insert into public.professional_search_profiles as p (
      user_id,
      country_code,
      is_profile_complete,
      is_public_searchable,
      is_active,
      is_approved
    )
    values (
      new.id,
      coalesce(new.country_code, 'GB'),
      false,
      false,
      true,
      false
    )
    on conflict (user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists users_ensure_professional_search_profile_after_insert on public.users;
create trigger users_ensure_professional_search_profile_after_insert
  after insert on public.users
  for each row
  execute function public.ensure_professional_search_profile_for_user();

drop trigger if exists users_ensure_professional_search_profile_after_update on public.users;
create trigger users_ensure_professional_search_profile_after_update
  after update of is_professional on public.users
  for each row
  when (coalesce(new.is_professional, false) is true and coalesce(old.is_professional, false) is not true)
  execute function public.ensure_professional_search_profile_for_user();

-- 4) RLS on professional_search_profiles
drop policy if exists "professional_search_profiles_select_own" on public.professional_search_profiles;
create policy "professional_search_profiles_select_own"
  on public.professional_search_profiles
  for select
  to authenticated
  using (
    user_id = (
      select u.id
      from public.users u
      where u.auth_user_id = auth.uid()
      limit 1
    )
  );

drop policy if exists "professional_search_profiles_select_public" on public.professional_search_profiles;
create policy "professional_search_profiles_select_public"
  on public.professional_search_profiles
  for select
  to anon, authenticated
  using (
    is_profile_complete = true
    and is_public_searchable = true
    and is_active = true
    and is_approved = true
  );

drop policy if exists "professional_search_profiles_insert_own" on public.professional_search_profiles;
create policy "professional_search_profiles_insert_own"
  on public.professional_search_profiles
  for insert
  to authenticated
  with check (
    user_id = (
      select u.id
      from public.users u
      where u.auth_user_id = auth.uid()
      limit 1
    )
  );

drop policy if exists "professional_search_profiles_update_own" on public.professional_search_profiles;
create policy "professional_search_profiles_update_own"
  on public.professional_search_profiles
  for update
  to authenticated
  using (
    user_id = (
      select u.id
      from public.users u
      where u.auth_user_id = auth.uid()
      limit 1
    )
  )
  with check (
    user_id = (
      select u.id
      from public.users u
      where u.auth_user_id = auth.uid()
      limit 1
    )
  );

-- 5) Enriched search view (join profiles; drop ratings from projection)
-- Drop first: column set changed vs prior view (CREATE OR REPLACE cannot rename columns in PG).
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
  p.location_input_text,
  p.mapbox_id,
  p.latitude,
  p.longitude,
  p.service_radius_km,
  coalesce(
    array_agg(distinct s.label) filter (where s.label is not null),
    array[]::text[]
  ) as specialties
from public.users u
inner join public.professional_search_profiles p
  on p.user_id = u.id
left join public.professional_specialties ps
  on ps.professional_id = u.id
left join public.specialties s
  on s.id = ps.specialty_id
where u.is_professional = true
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
  p.location_input_text,
  p.mapbox_id,
  p.latitude,
  p.longitude,
  p.service_radius_km;

grant select on public.professional_search_cards_enriched to anon, authenticated;

-- 6) Public read of users rows for listed professionals (via profile predicates)
drop policy if exists "users_select_public_searchable" on public.users;
create policy "users_select_public_searchable"
  on public.users
  for select
  to anon, authenticated
  using (
    is_professional = true
    and exists (
      select 1
      from public.professional_search_profiles p
      where p.user_id = users.id
        and p.is_profile_complete = true
        and p.is_public_searchable = true
        and p.is_active = true
        and p.is_approved = true
    )
  );

-- 7) Replace location index on users with listing index on profiles
drop index if exists public.users_public_search_location_idx;

create index if not exists professional_search_profiles_public_list_idx
  on public.professional_search_profiles (country_code)
  where is_profile_complete = true
    and is_public_searchable = true
    and is_active = true
    and is_approved = true;

-- 8) Drop moved / obsolete columns from users
alter table public.users
  drop constraint if exists users_rating_avg_range;

alter table public.users
  drop constraint if exists users_rating_count_non_negative;

alter table public.users
  drop column if exists is_profile_complete,
  drop column if exists is_searchable,
  drop column if exists is_public_searchable,
  drop column if exists location_locality,
  drop column if exists location_region,
  drop column if exists postal_code,
  drop column if exists service_area,
  drop column if exists rating_avg,
  drop column if exists rating_count;
