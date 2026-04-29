-- Professional profile hardening:
-- - text length / required-field checks for MVP editor
-- - profile photo storage guardrails
-- - optional authoritative upsert function for phase 2 edge orchestration

-- 1) Field-level constraints
alter table public.users
  add constraint users_first_name_len check (
    first_name is null
    or char_length(btrim(first_name)) between 1 and 80
  ),
  add constraint users_last_name_len check (
    last_name is null
    or char_length(btrim(last_name)) between 1 and 80
  ),
  add constraint users_bio_len check (
    bio is null
    or char_length(btrim(bio)) between 1 and 1500
  ),
  add constraint users_profile_photo_url_len check (
    profile_photo_url is null
    or char_length(profile_photo_url) <= 2048
  );

update public.professional_credentials
set issuing_body = 'Self reported'
where issuing_body is null
   or btrim(issuing_body) = '';

alter table public.professional_credentials
  alter column issuing_body set not null,
  add constraint professional_credentials_type_len check (
    char_length(btrim(credential_type)) between 1 and 120
  ),
  add constraint professional_credentials_label_len check (
    char_length(btrim(credential_label)) between 1 and 200
  ),
  add constraint professional_credentials_issuing_body_len check (
    char_length(btrim(issuing_body)) between 1 and 160
  ),
  add constraint professional_credentials_registration_number_len check (
    registration_number is null
    or char_length(btrim(registration_number)) <= 80
  );

alter table public.professional_search_profiles
  add constraint professional_search_profiles_location_label_len check (
    location_label is null
    or char_length(btrim(location_label)) between 1 and 160
  ),
  add constraint professional_search_profiles_mapbox_id_len check (
    mapbox_id is null
    or char_length(mapbox_id) <= 255
  );

-- 2) Storage guardrails for profile photos
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'profile-photos',
  'profile-photos',
  true,
  3145728,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "profile_photos_public_read" on storage.objects;
create policy "profile_photos_public_read"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'profile-photos');

drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- 3) Optional authoritative profile upsert (phase 2)
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
  v_mapbox_id text;
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
  v_mapbox_id := nullif(
    left(regexp_replace(coalesce(p_payload ->> 'mapboxId', ''), '<[^>]*>', '', 'g'), 255),
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
    mapbox_id = v_mapbox_id,
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
