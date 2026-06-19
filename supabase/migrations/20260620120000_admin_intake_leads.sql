-- Admin flag and RPC to list prelaunch intake leads for authenticated admins.

alter table public.users
  add column if not exists is_admin boolean not null default false;

comment on column public.users.is_admin is
  'When true, user may access admin routes and list_admin_intake_leads RPC. Set manually in SQL.';

create or replace function public.app_user_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
set row_security = off
as $$
  select coalesce(
    (select u.is_admin from public.users u where u.auth_user_id = auth.uid()),
    false
  );
$$;

create or replace function public.list_admin_intake_leads()
returns jsonb
language plpgsql
security definer
set search_path = public
set row_security = off
as $fn$
declare
  v_mothers jsonb;
  v_professionals jsonb;
begin
  if not public.app_user_is_admin() then
    return jsonb_build_object('ok', false, 'error', 'Forbidden');
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email,
        'lead_status', u.lead_status,
        'intake_submitted_at', u.intake_submitted_at,
        'location_label', cip.location_label,
        'specialty_labels', coalesce(specs.labels, '[]'::jsonb),
        'looking_for_details', cip.looking_for_details
      )
      order by u.intake_submitted_at desc nulls last
    ),
    '[]'::jsonb
  )
  into v_mothers
  from public.users u
  inner join public.client_intake_profiles cip on cip.user_id = u.id
  left join lateral (
    select jsonb_agg(s.label order by s.label) as labels
    from public.client_desired_specialties cds
    inner join public.specialties s on s.id = cds.specialty_id
    where cds.client_id = u.id
  ) specs on true
  where coalesce(u.is_professional, false) = false
    and u.intake_submitted_at is not null;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'id', u.id,
        'first_name', u.first_name,
        'last_name', u.last_name,
        'email', u.email,
        'lead_status', u.lead_status,
        'intake_submitted_at', u.intake_submitted_at,
        'location_label', psp.location_label,
        'specialty_labels', coalesce(specs.labels, '[]'::jsonb),
        'offers_remote', coalesce(psp.offers_remote, false),
        'offers_in_home', coalesce(psp.offers_in_home, false),
        'offers_provider_location', coalesce(psp.offers_provider_location, false),
        'credential_type', cred.credential_type,
        'issuing_body', cred.issuing_body,
        'registration_number', cred.registration_number
      )
      order by u.intake_submitted_at desc nulls last
    ),
    '[]'::jsonb
  )
  into v_professionals
  from public.users u
  inner join public.professional_search_profiles psp on psp.user_id = u.id
  left join lateral (
    select jsonb_agg(s.label order by s.label) as labels
    from public.professional_specialties ps
    inner join public.specialties s on s.id = ps.specialty_id
    where ps.professional_id = u.id
  ) specs on true
  left join lateral (
    select
      pc.credential_type,
      pc.issuing_body,
      pc.registration_number
    from public.professional_credentials pc
    where pc.professional_id = u.id
    order by pc.created_at desc
    limit 1
  ) cred on true
  where coalesce(u.is_professional, false) = true
    and u.intake_submitted_at is not null;

  return jsonb_build_object(
    'ok', true,
    'mothers', v_mothers,
    'professionals', v_professionals
  );
end;
$fn$;

revoke all on function public.app_user_is_admin() from public;
grant execute on function public.app_user_is_admin() to authenticated;

revoke all on function public.list_admin_intake_leads() from public;
grant execute on function public.list_admin_intake_leads() to authenticated;
