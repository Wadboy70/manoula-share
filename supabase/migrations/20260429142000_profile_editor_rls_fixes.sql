-- Profile editor RLS fixes:
-- 1) allow professionals to mutate their own professional_specialties rows
-- 2) harden profile-photos object policies to accept owner- and path-based ownership checks

-- professional_specialties write policies (missing in prior migrations)
grant insert, update, delete on public.professional_specialties to authenticated;

drop policy if exists "professional_specialties_insert_own" on public.professional_specialties;
create policy "professional_specialties_insert_own"
  on public.professional_specialties
  for insert
  to authenticated
  with check (professional_id = public.app_user_id_for_auth());

drop policy if exists "professional_specialties_update_own" on public.professional_specialties;
create policy "professional_specialties_update_own"
  on public.professional_specialties
  for update
  to authenticated
  using (professional_id = public.app_user_id_for_auth())
  with check (professional_id = public.app_user_id_for_auth());

drop policy if exists "professional_specialties_delete_own" on public.professional_specialties;
create policy "professional_specialties_delete_own"
  on public.professional_specialties
  for delete
  to authenticated
  using (professional_id = public.app_user_id_for_auth());

-- storage ownership checks: keep folder ownership and additionally allow owner match
drop policy if exists "profile_photos_insert_own" on storage.objects;
create policy "profile_photos_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or owner::text = auth.uid()::text
    )
  );

drop policy if exists "profile_photos_update_own" on storage.objects;
create policy "profile_photos_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or owner::text = auth.uid()::text
    )
  )
  with check (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or owner::text = auth.uid()::text
    )
  );

drop policy if exists "profile_photos_delete_own" on storage.objects;
create policy "profile_photos_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'profile-photos'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or owner::text = auth.uid()::text
    )
  );
