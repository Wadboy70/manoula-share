# Database schema notes (search and geo)

This file documents tables and columns that matter for **local search seeding** and the **search edge function**. Canonical definitions live in [`supabase/migrations/`](../supabase/migrations/); generated TypeScript is in [`src/types/database.ts`](../src/types/database.ts).

## `professional_search_profiles`

Public search profile for a professional (`user_id` → `users`). Used as the **home / base** location for radius checks.

- `mapbox_id`, `latitude`, `longitude`, `location_label`
- Delivery flags: `offers_remote`, `offers_in_home`, `offers_provider_location`
- Listing: `is_public_searchable`, `is_profile_complete`, `is_active`, `is_approved`, `country_code`

## `services`

Per-professional offerings. Search view aggregates active rows.

- `delivery_mode` (e.g. remote, in_home, provider_location, hybrid)
- `service_area_type` (e.g. `place_list`, `radius`, custom)
- `service_radius_km`, `service_area_text`
- `specialty_id` → `specialties.label` in enriched JSON as `specialty_label`

## `service_area_places`

Rows tied to a service when `service_area_type = place_list`: explicit Mapbox places the professional serves.

- `service_id`, `mapbox_id`, `latitude`, `longitude`

## `service_provider_locations`

Studio / clinic anchors for `delivery_mode = provider_location`.

- `service_id`, `mapbox_id`, `latitude`, `longitude`

## View: `professional_search_cards_enriched`

Read-only view used by the app and `search-cards` edge function: profile fields, aggregated `specialties` (labels), and a `services` JSON array including geo child data for filtering.

For local development, Mapbox IDs and coordinates used in seeds may be recorded in a local-only file under `notes/mapbox-id-locations.md` (see [`supabase/seeds/local_search_seed.sql`](../supabase/seeds/local_search_seed.sql) header comments).
