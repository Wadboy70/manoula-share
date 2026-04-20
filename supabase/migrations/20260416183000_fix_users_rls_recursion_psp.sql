-- Fix 42P17 infinite recursion: `professional_search_profiles` policies subqueried
-- `public.users`, which re-evaluated `users` RLS while resolving `users_select_public_searchable`
-- (EXISTS over profiles → profile RLS → SELECT users → users RLS → …).

create or replace function public.app_user_id_for_auth()
returns bigint
language plpgsql
stable
security definer
set search_path = public
set row_security = off
as $$
begin
  return (
    select u.id
    from public.users u
    where u.auth_user_id = auth.uid()
    limit 1
  );
end;
$$;

comment on function public.app_user_id_for_auth() is
  'Returns public.users.id for the current auth session; SECURITY DEFINER + row_security off avoids RLS recursion from professional_search_profiles policies.';

revoke all on function public.app_user_id_for_auth() from public;
grant execute on function public.app_user_id_for_auth() to authenticated;

drop policy if exists "professional_search_profiles_select_own" on public.professional_search_profiles;
create policy "professional_search_profiles_select_own"
  on public.professional_search_profiles
  for select
  to authenticated
  using (user_id = public.app_user_id_for_auth());

drop policy if exists "professional_search_profiles_insert_own" on public.professional_search_profiles;
create policy "professional_search_profiles_insert_own"
  on public.professional_search_profiles
  for insert
  to authenticated
  with check (user_id = public.app_user_id_for_auth());

drop policy if exists "professional_search_profiles_update_own" on public.professional_search_profiles;
create policy "professional_search_profiles_update_own"
  on public.professional_search_profiles
  for update
  to authenticated
  using (user_id = public.app_user_id_for_auth())
  with check (user_id = public.app_user_id_for_auth());
