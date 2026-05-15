# Messaging MVP (implementation notes)

## Architecture

- **Bookings** anchor every thread: `public.bookings` holds `client_id`, `professional_id`, `service_id`, and `status` (`pending` | `accepted` | `declined` | `completed`). New rows default to `pending`.
- **Conversations** are strictly **1:1** with a booking (`conversations.booking_id` unique, not null). Service context lives only on the booking (`bookings.service_id`).
- **At most one active booking** per `(client, professional, service)` is enforced with a partial unique index on `bookings` where `status in ('pending', 'accepted')`. When a booking is `completed` or `declined`, a new booking (and new conversation) can be created for the same triple.
- **`ensure_messaging_conversation(professional_id, service_id)`** is a `SECURITY DEFINER` RPC that returns `conversations.id`, reusing an active booking/conversation or inserting both in one transaction. The app uses direct Supabase reads/writes for messages; the RPC exists for atomic, validated creation.
- **Denormalized previews** on `conversations` (`last_message_preview`, `last_message_at`, `last_activity_at`) are updated by a `SECURITY DEFINER` trigger on `messages` insert so the inbox stays fast without aggregating messages per row.

## Realtime

- Table **`public.messages`** is added to the **`supabase_realtime`** publication. The open thread subscribes to `postgres_changes` with `filter: conversation_id=eq.<id>`.
- New inserts merge into local state (with dedupe by `id` if the client also appends the row returned from `insert`).

## UI entry

- **Book consultation** on search cards routes to **`/messages/start/:professionalId`** (protected). If the professional has **multiple** active services, the user picks a service before `ensure_messaging_conversation` runs. With **exactly one** service, the RPC runs automatically after load.

## RLS highlights

- **`messages`**: insert only when `sender_id = app_user_id_for_auth()` and the user is a participant on the parent booking.
- **`users_select_messaging_partners`**: allows each party to read the other’s `users` row when they share a conversation (see product note on minimising exposed columns later).

## Remote schema

- After applying migrations to a linked Supabase project, run **`supabase db push`** (or your deployment pipeline) and regenerate **`src/types/database.ts`** (`supabase gen types typescript --linked`).

## TODO(booking): integrating real booking flows

- **Status transitions**: add narrow `UPDATE` policies (or RPCs) for `bookings.status` (`pending` → `accepted` | `declined`; `accepted` → `completed`; etc.) and enforce allowed transitions in a trigger or typed RPC.
- **Richer booking rows**: follow-on migrations for `scheduled_at`, price snapshot, cancellation, etc.—conversation/booking linkage already supports attaching that data to the same `bookings.id`.
- **Checkout / payment**: likely triggered after messaging or from booking detail; keep using **`conversations.booking_id`** as the join key so messaging and booking UIs stay aligned.
