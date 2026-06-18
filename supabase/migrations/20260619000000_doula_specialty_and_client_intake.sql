-- Rename doula specialty label, harden intake text normalization, allow empty client specialty_ids.

-- 1) Label rename (keep slug for stable FKs)
update public.specialties
set label = 'Doula care'
where slug = 'postpartum-doula-care';

-- 2) Stronger text normalization for intake payloads
create or replace function public.intake_normalize_text(p_value text, p_max integer)
returns text
language sql
immutable
as $$
  select left(
    trim(
      replace(
        regexp_replace(coalesce(p_value, ''), '<[^>]*>', '', 'g'),
        chr(0),
        ''
      )
    ),
    p_max
  );
$$;

-- 3) submit_client_intake: empty specialty_ids allowed (e.g. mother chose "Something else")
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

  if coalesce(array_length(v_specialty_ids, 1), 0) > 0 then
    foreach v_spec_id in array v_specialty_ids loop
      if not exists (select 1 from public.specialties s where s.id = v_spec_id) then
        return jsonb_build_object('ok', false, 'error', 'One or more specialties are invalid.');
      end if;
    end loop;
  end if;

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

  if coalesce(array_length(v_specialty_ids, 1), 0) > 0 then
    insert into public.client_desired_specialties (client_id, specialty_id)
    select v_user_id, unnest(v_specialty_ids);
  end if;

  return jsonb_build_object('ok', true);
end;
$fn$;
