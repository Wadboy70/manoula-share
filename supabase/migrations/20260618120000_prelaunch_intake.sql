-- Prelaunch intake: client profiles, lead metadata, SECURITY DEFINER RPCs, auth linking.

-- 1) Lead metadata on users
alter table public.users
  add column if not exists lead_status text,
  add column if not exists intake_submitted_at timestamp with time zone;

alter table public.users
  drop constraint if exists users_lead_status_check;

alter table public.users
  add constraint users_lead_status_check check (
    lead_status is null
    or lead_status in ('prelaunch', 'invited', 'active')
  );

comment on column public.users.lead_status is
  'prelaunch = intake lead without auth; invited = invite sent; active = linked auth account.';

-- 2) Client intake profile (1:1 with non-professional leads)
create table if not exists public.client_intake_profiles (
  user_id bigint not null references public.users (id) on delete cascade,
  country_code text not null default 'GB',
  location_label text,
  place_id text,
  latitude double precision,
  longitude double precision,
  geocoded_at timestamp with time zone,
  looking_for_details text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint client_intake_profiles_pkey primary key (user_id),
  constraint client_intake_profiles_location_label_len check (
    location_label is null or char_length(trim(location_label)) <= 160
  ),
  constraint client_intake_profiles_place_id_len check (
    place_id is null or char_length(trim(place_id)) <= 2048
  ),
  constraint client_intake_profiles_looking_for_details_len check (
    looking_for_details is null or char_length(looking_for_details) <= 1000
  )
);

create or replace function public.client_intake_profiles_set_updated_at()
returns trigger
language plpgsql
as $fn$
begin
  new.updated_at := now();
  return new;
end;
$fn$;

drop trigger if exists client_intake_profiles_set_updated_at on public.client_intake_profiles;
create trigger client_intake_profiles_set_updated_at
  before update on public.client_intake_profiles
  for each row
  execute function public.client_intake_profiles_set_updated_at();

-- 3) Client desired specialties
create table if not exists public.client_desired_specialties (
  client_id bigint not null references public.users (id) on delete cascade,
  specialty_id bigint not null references public.specialties (id) on delete cascade,
  created_at timestamp with time zone not null default now(),
  constraint client_desired_specialties_pkey primary key (client_id, specialty_id)
);

create index if not exists client_desired_specialties_client_id_idx
  on public.client_desired_specialties (client_id);

create index if not exists client_desired_specialties_specialty_id_idx
  on public.client_desired_specialties (specialty_id);

-- 4) RLS: RPC-only writes (no client policies)
alter table public.client_intake_profiles enable row level security;
alter table public.client_desired_specialties enable row level security;

revoke all on table public.client_intake_profiles from anon, authenticated;
revoke all on table public.client_desired_specialties from anon, authenticated;

-- 5) Link auth signup to existing prelaunch leads by email
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    auth_user_id,
    email,
    first_name,
    last_name,
    country_code,
    lead_status
  )
  values (
    new.id,
    lower(trim(new.email)),
    nullif(trim(new.raw_user_meta_data ->> 'first_name'), ''),
    nullif(trim(new.raw_user_meta_data ->> 'last_name'), ''),
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'country_code'), ''),
      'GB'
    ),
    'active'
  )
  on conflict (email) do update set
    auth_user_id = excluded.auth_user_id,
    lead_status = 'active',
    first_name = coalesce(public.users.first_name, excluded.first_name),
    last_name = coalesce(public.users.last_name, excluded.last_name),
    country_code = coalesce(public.users.country_code, excluded.country_code)
  where public.users.auth_user_id is null;

  return new;
end;
$$;

-- 6) Intake helpers
create or replace function public.intake_normalize_email(p_email text)
returns text
language sql
immutable
as $$
  select lower(trim(p_email));
$$;

create or replace function public.intake_normalize_text(p_value text, p_max integer)
returns text
language sql
immutable
as $$
  select left(regexp_replace(coalesce(p_value, ''), '<[^>]*>', '', 'g'), p_max);
$$;

-- 7) submit_client_intake
create or replace function public.submit_client_intake(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  v_email text;
  v_first_name text;
  v_last_name text;
  v_looking_for_details text;
  v_location_label text;
  v_place_id text;
  v_latitude double precision;
  v_longitude double precision;
  v_geocoded_at timestamptz;
  v_country_code text;
  v_specialty_ids bigint[];
  v_user_id bigint;
  v_existing_professional boolean;
  v_existing_auth uuid;
  v_spec_id bigint;
begin
  v_email := public.intake_normalize_email(payload ->> 'email');
  v_first_name := public.intake_normalize_text(payload ->> 'first_name', 80);
  v_last_name := public.intake_normalize_text(payload ->> 'last_name', 80);
  v_looking_for_details := public.intake_normalize_text(payload ->> 'looking_for_details', 1000);
  v_location_label := public.intake_normalize_text(payload ->> 'location_label', 160);
  v_place_id := public.intake_normalize_text(payload ->> 'place_id', 2048);
  v_country_code := coalesce(nullif(trim(payload ->> 'country_code'), ''), 'GB');

  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'error', 'A valid email is required.');
  end if;

  if v_first_name = '' then
    return jsonb_build_object('ok', false, 'error', 'First name is required.');
  end if;

  if v_location_label = '' or v_place_id = '' then
    return jsonb_build_object('ok', false, 'error', 'Select a location from the suggestions list.');
  end if;

  begin
    v_latitude := (payload ->> 'latitude')::double precision;
  exception when others then
    v_latitude := null;
  end;

  begin
    v_longitude := (payload ->> 'longitude')::double precision;
  exception when others then
    v_longitude := null;
  end;

  begin
    v_geocoded_at := (payload ->> 'geocoded_at')::timestamptz;
  exception when others then
    v_geocoded_at := null;
  end;

  select coalesce(
    array(
      select value::bigint
      from jsonb_array_elements_text(coalesce(payload -> 'specialty_ids', '[]'::jsonb)) as t(value)
      where value ~ '^[0-9]+$'
    ),
    array[]::bigint[]
  )
  into v_specialty_ids;

  if coalesce(array_length(v_specialty_ids, 1), 0) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Please select at least one specialty.');
  end if;

  foreach v_spec_id in array v_specialty_ids loop
    if not exists (select 1 from public.specialties s where s.id = v_spec_id) then
      return jsonb_build_object('ok', false, 'error', 'One or more specialties are invalid.');
    end if;
  end loop;

  select u.id, coalesce(u.is_professional, false), u.auth_user_id
  into v_user_id, v_existing_professional, v_existing_auth
  from public.users u
  where u.email = v_email;

  if v_user_id is not null then
    if v_existing_auth is not null then
      return jsonb_build_object('ok', false, 'error', 'This email is already registered.');
    end if;
    if v_existing_professional then
      return jsonb_build_object('ok', false, 'error', 'This email already has a professional intake on file.');
    end if;

    update public.users
    set
      first_name = v_first_name,
      last_name = nullif(v_last_name, ''),
      is_professional = false,
      lead_status = 'prelaunch',
      intake_submitted_at = now()
    where id = v_user_id;
  else
    insert into public.users (
      email,
      first_name,
      last_name,
      country_code,
      is_professional,
      lead_status,
      intake_submitted_at
    )
    values (
      v_email,
      v_first_name,
      nullif(v_last_name, ''),
      v_country_code,
      false,
      'prelaunch',
      now()
    )
    returning id into v_user_id;
  end if;

  insert into public.client_intake_profiles (
    user_id,
    country_code,
    location_label,
    place_id,
    latitude,
    longitude,
    geocoded_at,
    looking_for_details
  )
  values (
    v_user_id,
    v_country_code,
    v_location_label,
    v_place_id,
    v_latitude,
    v_longitude,
    v_geocoded_at,
    nullif(v_looking_for_details, '')
  )
  on conflict (user_id) do update set
    country_code = excluded.country_code,
    location_label = excluded.location_label,
    place_id = excluded.place_id,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    geocoded_at = excluded.geocoded_at,
    looking_for_details = excluded.looking_for_details,
    updated_at = now();

  delete from public.client_desired_specialties where client_id = v_user_id;

  insert into public.client_desired_specialties (client_id, specialty_id)
  select v_user_id, unnest(v_specialty_ids);

  return jsonb_build_object('ok', true);
end;
$fn$;

-- 8) submit_professional_intake
create or replace function public.submit_professional_intake(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  v_email text;
  v_first_name text;
  v_last_name text;
  v_location_label text;
  v_place_id text;
  v_latitude double precision;
  v_longitude double precision;
  v_geocoded_at timestamptz;
  v_country_code text;
  v_offers_remote boolean;
  v_offers_in_home boolean;
  v_offers_provider_location boolean;
  v_credential_type text;
  v_issuing_body text;
  v_registration_number text;
  v_specialty_ids bigint[];
  v_user_id bigint;
  v_existing_auth uuid;
  v_spec_id bigint;
begin
  v_email := public.intake_normalize_email(payload ->> 'email');
  v_first_name := public.intake_normalize_text(payload ->> 'first_name', 80);
  v_last_name := public.intake_normalize_text(payload ->> 'last_name', 80);
  v_location_label := public.intake_normalize_text(payload ->> 'location_label', 160);
  v_place_id := public.intake_normalize_text(payload ->> 'place_id', 2048);
  v_country_code := coalesce(nullif(trim(payload ->> 'country_code'), ''), 'GB');
  v_credential_type := public.intake_normalize_text(payload ->> 'credential_type', 120);
  v_issuing_body := public.intake_normalize_text(payload ->> 'issuing_body', 160);
  v_registration_number := public.intake_normalize_text(payload ->> 'registration_number', 80);

  v_offers_remote := coalesce((payload ->> 'offers_remote')::boolean, false);
  v_offers_in_home := coalesce((payload ->> 'offers_in_home')::boolean, false);
  v_offers_provider_location := coalesce((payload ->> 'offers_provider_location')::boolean, false);

  if v_email is null or v_email = '' or position('@' in v_email) = 0 then
    return jsonb_build_object('ok', false, 'error', 'A valid email is required.');
  end if;

  if v_first_name = '' then
    return jsonb_build_object('ok', false, 'error', 'First name is required.');
  end if;

  if v_location_label = '' or v_place_id = '' then
    return jsonb_build_object('ok', false, 'error', 'Select a location from the suggestions list.');
  end if;

  if not v_offers_remote and not v_offers_in_home and not v_offers_provider_location then
    return jsonb_build_object('ok', false, 'error', 'Select at least one location preference.');
  end if;

  if v_credential_type = '' or v_issuing_body = '' then
    return jsonb_build_object('ok', false, 'error', 'Credential type and issuing body are required.');
  end if;

  begin
    v_latitude := (payload ->> 'latitude')::double precision;
  exception when others then
    v_latitude := null;
  end;

  begin
    v_longitude := (payload ->> 'longitude')::double precision;
  exception when others then
    v_longitude := null;
  end;

  begin
    v_geocoded_at := (payload ->> 'geocoded_at')::timestamptz;
  exception when others then
    v_geocoded_at := null;
  end;

  select coalesce(
    array(
      select value::bigint
      from jsonb_array_elements_text(coalesce(payload -> 'specialty_ids', '[]'::jsonb)) as t(value)
      where value ~ '^[0-9]+$'
    ),
    array[]::bigint[]
  )
  into v_specialty_ids;

  if coalesce(array_length(v_specialty_ids, 1), 0) = 0 then
    return jsonb_build_object('ok', false, 'error', 'Please select at least one specialty.');
  end if;

  foreach v_spec_id in array v_specialty_ids loop
    if not exists (select 1 from public.specialties s where s.id = v_spec_id) then
      return jsonb_build_object('ok', false, 'error', 'One or more specialties are invalid.');
    end if;
  end loop;

  select u.id, u.auth_user_id
  into v_user_id, v_existing_auth
  from public.users u
  where u.email = v_email;

  if v_user_id is not null then
    if v_existing_auth is not null then
      return jsonb_build_object('ok', false, 'error', 'This email is already registered.');
    end if;

    update public.users
    set
      first_name = v_first_name,
      last_name = nullif(v_last_name, ''),
      is_professional = true,
      country_code = v_country_code,
      lead_status = 'prelaunch',
      intake_submitted_at = now()
    where id = v_user_id;

    delete from public.client_intake_profiles where user_id = v_user_id;
    delete from public.client_desired_specialties where client_id = v_user_id;
  else
    insert into public.users (
      email,
      first_name,
      last_name,
      country_code,
      is_professional,
      lead_status,
      intake_submitted_at
    )
    values (
      v_email,
      v_first_name,
      nullif(v_last_name, ''),
      v_country_code,
      true,
      'prelaunch',
      now()
    )
    returning id into v_user_id;
  end if;

  insert into public.professional_search_profiles (
    user_id,
    country_code,
    location_label,
    place_id,
    latitude,
    longitude,
    geocoded_at,
    offers_remote,
    offers_in_home,
    offers_provider_location,
    is_profile_complete,
    is_public_searchable,
    is_active,
    is_approved
  )
  values (
    v_user_id,
    v_country_code,
    v_location_label,
    v_place_id,
    v_latitude,
    v_longitude,
    v_geocoded_at,
    v_offers_remote,
    v_offers_in_home,
    v_offers_provider_location,
    false,
    false,
    true,
    false
  )
  on conflict (user_id) do update set
    country_code = excluded.country_code,
    location_label = excluded.location_label,
    place_id = excluded.place_id,
    latitude = excluded.latitude,
    longitude = excluded.longitude,
    geocoded_at = excluded.geocoded_at,
    offers_remote = excluded.offers_remote,
    offers_in_home = excluded.offers_in_home,
    offers_provider_location = excluded.offers_provider_location,
    is_profile_complete = false,
    is_public_searchable = false,
    is_active = true,
    is_approved = false;

  delete from public.professional_specialties where professional_id = v_user_id;
  insert into public.professional_specialties (professional_id, specialty_id)
  select v_user_id, unnest(v_specialty_ids);

  delete from public.professional_credentials where professional_id = v_user_id;
  insert into public.professional_credentials (
    professional_id,
    credential_type,
    credential_label,
    issuing_body,
    registration_number
  )
  values (
    v_user_id,
    v_credential_type,
    v_credential_type,
    v_issuing_body,
    nullif(v_registration_number, '')
  );

  return jsonb_build_object('ok', true);
end;
$fn$;

revoke all on function public.submit_client_intake(jsonb) from public;
revoke all on function public.submit_professional_intake(jsonb) from public;
grant execute on function public.submit_client_intake(jsonb) to anon, authenticated;
grant execute on function public.submit_professional_intake(jsonb) to anon, authenticated;

comment on function public.submit_client_intake(jsonb) is
  'Prelaunch mother/client intake; upserts users row without auth_user_id.';

comment on function public.submit_professional_intake(jsonb) is
  'Prelaunch professional intake; upserts users row without auth_user_id.';
