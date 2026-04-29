import type { Session, User } from '@supabase/supabase-js'

import type { Database } from '@/types/database'
import type { SearchCard } from '@/features/search/search.types'

export type UsersRow = Database['public']['Tables']['users']['Row']
export type ProfessionalSearchProfileRow =
  Database['public']['Tables']['professional_search_profiles']['Row']
export type ProfessionalCredentialRow =
  Database['public']['Tables']['professional_credentials']['Row']

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
