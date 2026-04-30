import type { Session, User } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import type { SearchCard } from '@/features/search/search.types'

export type UsersRow = Database['public']['Tables']['users']['Row']
export type ProfessionalSearchProfileRow =
  Database['public']['Tables']['professional_search_profiles']['Row']
export type ProfessionalCredentialRow =
  Database['public']['Tables']['professional_credentials']['Row']
export type ServiceRow = Database['public']['Tables']['services']['Row']
export type ServiceProviderLocationRow =
  Database['public']['Tables']['service_provider_locations']['Row']
export type ServiceAreaPlaceRow = Database['public']['Tables']['service_area_places']['Row']

const ISO = '2026-01-01T00:00:00.000Z'

/** Minimal Supabase `User` for session / sign-in payloads (fields the app reads). */
export function makeAuthUser(overrides: Partial<User> = {}): User {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    aud: 'authenticated',
    role: 'authenticated',
    email: 'client@example.com',
    app_metadata: {},
    user_metadata: {},
    identities: [],
    created_at: ISO,
    updated_at: ISO,
    ...overrides,
  } as User
}

export function makeSession(user: User): Session {
  return {
    access_token: 'test-access-token',
    refresh_token: 'test-refresh-token',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  } as Session
}

export function makeUsersRow(overrides: Partial<UsersRow> = {}): UsersRow {
  return {
    id: 1,
    created_at: ISO,
    auth_user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    first_name: 'Jane',
    last_name: 'Client',
    email: 'client@example.com',
    is_professional: false,
    profile_photo_url: null,
    bio: null,
    country_code: 'GB',
    ...overrides,
  }
}

export function makeProfessionalProfileRow(
  overrides: Partial<ProfessionalSearchProfileRow> = {},
): ProfessionalSearchProfileRow {
  return {
    user_id: 1,
    is_profile_complete: true,
    is_public_searchable: true,
    is_active: true,
    is_approved: true,
    country_code: 'GB',
    location_label: 'London',
    mapbox_id: null,
    latitude: null,
    longitude: null,
    offers_remote: false,
    offers_in_home: false,
    offers_provider_location: false,
    geocoded_at: null,
    rating_avg: null,
    rating_count: 0,
    ...overrides,
  }
}

export function makeProfessionalCredentialRow(
  overrides: Partial<ProfessionalCredentialRow> = {},
): ProfessionalCredentialRow {
  return {
    id: 11,
    professional_id: 1,
    credential_type: 'IBCLC',
    credential_label: 'IBCLC',
    issuing_body: 'IBLCE',
    registration_number: null,
    verification_status: 'unverified',
    expires_at: null,
    verified_at: null,
    created_at: ISO,
    ...overrides,
  }
}

export function makeSearchInvokeCard(overrides: Partial<SearchCard> = {}): SearchCard {
  return {
    professionalId: 42,
    firstName: 'Ada',
    lastName: 'Nwosu',
    profilePhotoUrl: null,
    countryCode: 'GB',
    locationLabel: 'In-person and virtual',
    mapboxId: null,
    latitude: null,
    longitude: null,
    offersRemote: false,
    offersInHome: false,
    offersProviderLocation: false,
    specialties: ['Lactation Consultant'],
    services: [],
    ...overrides,
  }
}

export function makeServiceRow(overrides: Partial<ServiceRow> = {}): ServiceRow {
  return {
    id: 10,
    professional_id: 1,
    specialty_id: null,
    title: 'Home visit',
    description: 'Postnatal support',
    price_cents: 12000,
    currency_code: 'GBP',
    duration_minutes: 60,
    delivery_mode: 'in_home',
    remote_scope: null,
    provider_location_name: null,
    service_area_type: 'place_list',
    service_radius_km: null,
    service_area_text: null,
    is_active: true,
    created_at: ISO,
    updated_at: ISO,
    ...overrides,
  }
}

export function makeServiceProviderLocationRow(
  overrides: Partial<ServiceProviderLocationRow> = {},
): ServiceProviderLocationRow {
  return {
    id: 21,
    service_id: 10,
    location_name: 'Clinic',
    location_label: 'Manchester, UK',
    mapbox_id: 'mbx.1',
    latitude: 53.48,
    longitude: -2.24,
    geocoded_at: ISO,
    country_code: 'GB',
    created_at: ISO,
    ...overrides,
  }
}

export function makeServiceAreaPlaceRow(overrides: Partial<ServiceAreaPlaceRow> = {}): ServiceAreaPlaceRow {
  return {
    id: 31,
    service_id: 10,
    location_label: 'London, UK',
    mapbox_id: 'mbx.2',
    latitude: 51.5,
    longitude: -0.12,
    geocoded_at: ISO,
    country_code: 'GB',
    created_at: ISO,
    ...overrides,
  }
}
