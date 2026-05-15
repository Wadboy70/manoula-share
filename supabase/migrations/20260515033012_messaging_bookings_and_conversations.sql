-- MVP messaging (1:1 text) + minimal bookings.
-- booking_id on conversations is 1:1 with bookings; service_id lives on bookings only.

-- 1) Booking status enum
create type public.booking_status as enum (
  'pending',
  'accepted',
  'declined',
  'completed'
);

-- 2) Bookings (minimal; extend in future migrations)
create table public.bookings (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  client_id bigint not null references public.users (id) on delete cascade,
  professional_id bigint not null references public.users (id) on delete cascade,
  service_id bigint not null references public.services (id) on delete restrict,
  status public.booking_status not null default 'pending',
  constraint bookings_client_ne_professional check (client_id <> professional_id)
);

comment on table public.bookings is
  'TODO(booking): add scheduled_at, price snapshot, notes, cancellation fields via future migration.';

create unique index bookings_one_active_per_client_prof_service_idx
  on public.bookings (client_id, professional_id, service_id)
  where (status in ('pending', 'accepted'));

create index bookings_professional_created_at_idx
  on public.bookings (professional_id, created_at desc);

create index bookings_client_created_at_idx
  on public.bookings (client_id, created_at desc);

-- Validate service belongs to professional and is publicly bookable (align with services_select_public)
create or replace function public.bookings_validate_service_professional()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.services s
    where s.id = new.service_id
      and s.professional_id = new.professional_id
      and s.is_active = true
      and public.is_professional_publicly_listable(s.professional_id)
  ) then
    raise exception 'Invalid service for booking';
  end if;
  return new;
end;
$$;

drop trigger if exists bookings_validate_service_professional_trigger on public.bookings;
create trigger bookings_validate_service_professional_trigger
  before insert or update of service_id, professional_id on public.bookings
  for each row execute function public.bookings_validate_service_professional();

create or replace function public.bookings_set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
  before update on public.bookings
  for each row execute function public.bookings_set_updated_at();

-- 3) Conversations (strict 1:1 with booking)
create table public.conversations (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone not null default now(),
  booking_id bigint not null unique references public.bookings (id) on delete cascade,
  last_activity_at timestamp with time zone not null default now(),
  last_message_at timestamp with time zone,
  last_message_preview text
);

comment on column public.conversations.booking_id is
  'One conversation per booking for the life of that booking; new booking => new conversation.';

-- 4) Messages
create table public.messages (
  id bigint generated always as identity primary key,
  created_at timestamp with time zone not null default now(),
  conversation_id bigint not null references public.conversations (id) on delete cascade,
  sender_id bigint not null references public.users (id) on delete cascade,
  body text not null,
  constraint messages_body_non_empty check (length(trim(body)) > 0),
  constraint messages_body_max_len check (char_length(body) <= 8000)
);

create index messages_conversation_created_at_idx
  on public.messages (conversation_id, created_at asc);

-- Bump conversation activity + preview (SECURITY DEFINER so RLS does not block updates)
create or replace function public.messages_bump_conversation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations
  set
    last_activity_at = new.created_at,
    last_message_at = new.created_at,
    last_message_preview = left(trim(new.body), 200)
  where id = new.conversation_id;
  return new;
end;
$$;

drop trigger if exists messages_bump_conversation_trigger on public.messages;
create trigger messages_bump_conversation_trigger
  after insert on public.messages
  for each row execute function public.messages_bump_conversation();

-- 5) Atomic ensure: booking (pending) + conversation, or return existing active triple
create or replace function public.ensure_messaging_conversation(
  p_professional_id bigint,
  p_service_id bigint
) returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client bigint;
  v_conversation_id bigint;
  v_booking_id bigint;
begin
  v_client := public.app_user_id_for_auth();
  if v_client is null then
    raise exception 'Not authenticated';
  end if;

  if v_client = p_professional_id then
    raise exception 'Cannot start a conversation with yourself';
  end if;

  if not exists (
    select 1
    from public.users u
    where u.id = p_professional_id
      and coalesce(u.is_professional, false) = true
  ) then
    raise exception 'Invalid professional';
  end if;

  if not exists (
    select 1
    from public.services s
    where s.id = p_service_id
      and s.professional_id = p_professional_id
      and s.is_active = true
      and public.is_professional_publicly_listable(s.professional_id)
  ) then
    raise exception 'Invalid service';
  end if;

  select c.id
  into v_conversation_id
  from public.conversations c
  inner join public.bookings b on b.id = c.booking_id
  where b.client_id = v_client
    and b.professional_id = p_professional_id
    and b.service_id = p_service_id
    and b.status in ('pending', 'accepted')
  limit 1;

  if v_conversation_id is not null then
    return v_conversation_id;
  end if;

  begin
    insert into public.bookings (client_id, professional_id, service_id, status)
    values (v_client, p_professional_id, p_service_id, 'pending')
    returning id into v_booking_id;
  exception
    when unique_violation then
      select c.id
      into v_conversation_id
      from public.conversations c
      inner join public.bookings b on b.id = c.booking_id
      where b.client_id = v_client
        and b.professional_id = p_professional_id
        and b.service_id = p_service_id
        and b.status in ('pending', 'accepted')
      limit 1;
      if v_conversation_id is not null then
        return v_conversation_id;
      end if;
      raise;
  end;

  insert into public.conversations (booking_id)
  values (v_booking_id)
  returning id into v_conversation_id;

  return v_conversation_id;
end;
$$;

comment on function public.ensure_messaging_conversation(bigint, bigint) is
  'Creates or returns existing conversation for (client, professional, service) with an active booking.';

revoke all on function public.ensure_messaging_conversation(bigint, bigint) from public;
grant execute on function public.ensure_messaging_conversation(bigint, bigint) to authenticated;

revoke all on function public.bookings_validate_service_professional() from public;

-- 6) RLS
alter table public.bookings enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;

-- bookings
drop policy if exists "bookings_select_participant" on public.bookings;
create policy "bookings_select_participant"
  on public.bookings
  for select
  to authenticated
  using (
    client_id = public.app_user_id_for_auth()
    or professional_id = public.app_user_id_for_auth()
  );

drop policy if exists "bookings_insert_client" on public.bookings;
create policy "bookings_insert_client"
  on public.bookings
  for insert
  to authenticated
  with check (
    client_id = public.app_user_id_for_auth()
    and client_id <> professional_id
    and exists (
      select 1
      from public.users u
      where u.id = professional_id
        and coalesce(u.is_professional, false) = true
    )
    and exists (
      select 1
      from public.services s
      where s.id = service_id
        and s.professional_id = professional_id
        and s.is_active = true
        and public.is_professional_publicly_listable(s.professional_id)
    )
  );

-- TODO(booking): add narrow UPDATE policies for status transitions (pending→accepted|declined; accepted→completed).

-- conversations
drop policy if exists "conversations_select_participant" on public.conversations;
create policy "conversations_select_participant"
  on public.conversations
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      where b.id = conversations.booking_id
        and (
          b.client_id = public.app_user_id_for_auth()
          or b.professional_id = public.app_user_id_for_auth()
        )
    )
  );

drop policy if exists "conversations_insert_participant" on public.conversations;
create policy "conversations_insert_participant"
  on public.conversations
  for insert
  to authenticated
  with check (
    exists (
      select 1
      from public.bookings b
      where b.id = conversations.booking_id
        and b.client_id = public.app_user_id_for_auth()
    )
  );

-- messages
drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.conversations c
      inner join public.bookings b on b.id = c.booking_id
      where c.id = messages.conversation_id
        and (
          b.client_id = public.app_user_id_for_auth()
          or b.professional_id = public.app_user_id_for_auth()
        )
    )
  );

drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages
  for insert
  to authenticated
  with check (
    sender_id = public.app_user_id_for_auth()
    and exists (
      select 1
      from public.conversations c
      inner join public.bookings b on b.id = c.booking_id
      where c.id = messages.conversation_id
        and (
          b.client_id = public.app_user_id_for_auth()
          or b.professional_id = public.app_user_id_for_auth()
        )
    )
  );

-- Allow messaging partners to read limited user profile context (see docs/messaging-mvp.md)
drop policy if exists "users_select_messaging_partners" on public.users;
create policy "users_select_messaging_partners"
  on public.users
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.bookings b
      inner join public.conversations c on c.booking_id = b.id
      where (b.client_id = users.id or b.professional_id = users.id)
        and (
          b.client_id = public.app_user_id_for_auth()
          or b.professional_id = public.app_user_id_for_auth()
        )
    )
  );

-- Grants
grant select on table public.bookings to authenticated;
grant insert on table public.bookings to authenticated;

grant select, insert on table public.conversations to authenticated;

grant select, insert on table public.messages to authenticated;

-- Realtime (Postgres Changes)
alter publication supabase_realtime add table public.messages;
