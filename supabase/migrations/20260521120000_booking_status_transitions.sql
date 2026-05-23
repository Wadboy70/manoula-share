-- Booking status transitions + future scheduling column.

alter table public.bookings
  add column if not exists scheduled_at timestamp with time zone;

comment on column public.bookings.scheduled_at is
  'Planned session time; UI and scheduling flows deferred. Nullable until set.';

create index if not exists bookings_professional_status_idx
  on public.bookings (professional_id, status);

create index if not exists bookings_client_status_idx
  on public.bookings (client_id, status);

-- Enforce allowed status transitions (professional-only moves enforced in RPC).
create or replace function public.bookings_validate_status_transition()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if old.status = new.status then
    return new;
  end if;

  if old.status = 'pending' and new.status in ('accepted', 'declined') then
    return new;
  end if;

  if old.status = 'accepted' and new.status = 'completed' then
    return new;
  end if;

  raise exception 'Invalid booking status transition: % -> %', old.status, new.status;
end;
$$;

drop trigger if exists bookings_validate_status_transition_trigger on public.bookings;
create trigger bookings_validate_status_transition_trigger
  before update of status on public.bookings
  for each row execute function public.bookings_validate_status_transition();

-- Professional-only status updates via RPC (trigger validates transitions).
create or replace function public.update_booking_status(
  p_booking_id bigint,
  p_status public.booking_status
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller bigint;
  v_professional_id bigint;
begin
  v_caller := public.app_user_id_for_auth();
  if v_caller is null then
    raise exception 'Not authenticated';
  end if;

  select professional_id
  into v_professional_id
  from public.bookings
  where id = p_booking_id;

  if v_professional_id is null then
    raise exception 'Booking not found';
  end if;

  if v_caller <> v_professional_id then
    raise exception 'Only the professional can update booking status';
  end if;

  update public.bookings
  set status = p_status
  where id = p_booking_id;
end;
$$;

comment on function public.update_booking_status(bigint, public.booking_status) is
  'Professional updates booking status: pending→accepted|declined; accepted→completed.';

revoke all on function public.update_booking_status(bigint, public.booking_status) from public;
grant execute on function public.update_booking_status(bigint, public.booking_status) to authenticated;

revoke all on function public.bookings_validate_status_transition() from public;
