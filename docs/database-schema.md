# Database schema notes (search and geo)

This file documents tables and fields that matter for current search/profile/services behavior. Canonical DDL still lives in `supabase/migrations/`; generated app types live in `src/types/database.ts`.

## Why this shape

- Identity stays in `users`; search/listing state stays in `professional_search_profiles`.
- Search matching is service-aware (`services` + location child tables), not just profile-aware.
- Mapbox-backed fields (`mapbox_id`, lat/lng, labels) stay first-class to keep geo filters deterministic.
- Service geography is split by mode so we avoid one overloaded “location” field.

## `professional_search_profiles`

One row per professional (`user_id` = `users.id`), used for listing readiness and base location.

Key fields:
- Listing gates: `is_profile_complete`, `is_public_searchable`, `is_active`, `is_approved`
- Base place: `location_label`, `mapbox_id`, `latitude`, `longitude`, `geocoded_at`, `country_code`
- Modality flags: `offers_remote`, `offers_in_home`, `offers_provider_location`
- Ranking helpers: `rating_avg`, `rating_count`

Reasoning:
- This row is the listing envelope, not the full service-coverage model.
- Service-specific footprints belong on service tables, not here.

## `services`

Per-professional offerings (`professional_id` → `users.id`), optionally tied to a specialty.

Key fields:
- Commercial: `title`, `description`, `price_cents`, `currency_code`, `duration_minutes`, `is_active`
- Matching: `delivery_mode` (`remote`, `in_home`, `provider_location`)
- Remote scope: `remote_scope` (currently app uses `anywhere` / `country`)
- In-home modifiers: `service_area_type` (`radius` / `place_list` / `custom_text` in schema), `service_radius_km`, `service_area_text`
- Timestamps: `created_at`, `updated_at`

Reasoning:
- Service-level mode and coverage supports professionals offering multiple distinct footprints.
- `service_area_text` remains useful as a human summary even when structured rows are present.

## `service_provider_locations`

Provider-controlled visit places for `delivery_mode = provider_location` services.

Key fields:
- FK: `service_id`
- Place data: `location_name`, `location_label`, `mapbox_id`, `latitude`, `longitude`, `geocoded_at`, `country_code`

Reasoning:
- Naming and geocoded place data live at the row level so one service can support multiple provider locations.
- Keeping this separate avoids bloating `services` with repeated location columns.

## `service_area_places`

Mapbox-backed explicit coverage rows for place-list service areas.

Key fields:
- FK: `service_id`
- Place data: `location_label`, `mapbox_id`, `latitude`, `longitude`, `geocoded_at`, `country_code`

Reasoning:
- Used when service coverage is enumerated by places rather than radius.
- Preserves canonical place IDs for stable location matching.

## `professional_specialties` and `specialties`

- `specialties` is the normalized catalog.
- `professional_specialties` links professionals to the subset relevant to their profile.

Reasoning:
- Keeps profile taxonomy explicit and reusable across search/profile/services UI.

## `professional_credentials`

Credential records tied to a professional (`professional_id`).

Key fields:
- Credential identity: `credential_type`, `credential_label`, `issuing_body`, `registration_number`
- Verification lifecycle: `verification_status`, `verified_at`, `expires_at`

Reasoning:
- Supports immediate profile trust signals and future verification workflows.

## `reviews`

Ratings and optional free text tied to a professional.

Reasoning:
- Feed ranking/quality indicators (`rating_avg` / `rating_count`) surfaced via profile search data.

## Search-side objects

### Function: `search_service_matches_location`

Evaluates whether one service matches a user location for provider-location and in-home flows.

Reasoning:
- Centralizes service/location matching semantics in SQL for consistency with RPC search.

### Function: `search_professional_cards_page`

Main paginated search RPC:
- applies specialty/mode/location filters,
- enforces only listable professionals,
- ranks by Bayesian-like score (`rating_avg`, `rating_count`),
- returns cards with matching active services.

Current remote behavior:
- `remote_scope = anywhere` matches globally.
- `remote_scope = country` is country-bounded based on search location country code vs professional profile country.

### View: `professional_search_cards_enriched`

Convenience read model for listable professionals with aggregated specialties/services payloads.

Reasoning:
- Keeps app-side card rendering simple while preserving normalized base tables.

## Migration / ops reminder

After changing SQL in `supabase/migrations/`:
- apply to target project (`supabase db push` against the linked environment),
- then regenerate `src/types/database.ts` (`supabase gen types typescript --linked`).
