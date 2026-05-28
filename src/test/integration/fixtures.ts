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
    place_id: null,
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
    placeId: null,
    latitude: null,
    longitude: null,
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
    place_id: 'mbx.1',
    ancestor_place_ids: [],
    latitude: 53.48,
    longitude: -2.24,
    geocoded_at: ISO,
    country_code: 'GB',
    created_at: ISO,
    ...overrides,
  }
}

export type BookingListRowFixture = {
  id: number
  client_id: number
  professional_id: number
  service_id: number
  status: 'pending' | 'accepted' | 'declined' | 'completed'
  created_at: string
  updated_at: string
  scheduled_at: string | null
  client: {
    id: number
    first_name: string | null
    last_name: string | null
    profile_photo_url: string | null
  }
  professional: {
    id: number
    first_name: string | null
    last_name: string | null
    profile_photo_url: string | null
  }
  services: { id: number; title: string; delivery_mode: string }
  conversations: { id: number }
}

export function makeBookingListRow(
  overrides: Partial<BookingListRowFixture> = {},
): BookingListRowFixture {
  return {
    id: 1,
    client_id: 2,
    professional_id: 1,
    service_id: 10,
    status: 'pending',
    created_at: ISO,
    updated_at: ISO,
    scheduled_at: null,
    client: {
      id: 2,
      first_name: 'Alex',
      last_name: 'Client',
      profile_photo_url: null,
    },
    professional: {
      id: 1,
      first_name: 'Sam',
      last_name: 'Pro',
      profile_photo_url: null,
    },
    services: { id: 10, title: 'Initial consultation', delivery_mode: 'remote' },
    conversations: { id: 100 },
    ...overrides,
  }
}

export type AvailabilityRuleRowFixture = {
  id: number
  professional_id: number
  day_of_week: number
  start_time: string
  end_time: string
  created_at: string
  updated_at: string
}

export function makeAvailabilityRuleRow(
  overrides: Partial<AvailabilityRuleRowFixture> = {},
): AvailabilityRuleRowFixture {
  return {
    id: 1,
    professional_id: 1,
    day_of_week: 1,
    start_time: '09:00:00',
    end_time: '12:00:00',
    created_at: ISO,
    updated_at: ISO,
    ...overrides,
  }
}

export type AvailabilityExceptionRowFixture = {
  id: number
  professional_id: number
  exception_date: string
  kind: 'unavailable' | 'available'
  start_time: string | null
  end_time: string | null
  created_at: string
  updated_at: string
}

export function makeAvailabilityExceptionRow(
  overrides: Partial<AvailabilityExceptionRowFixture> = {},
): AvailabilityExceptionRowFixture {
  return {
    id: 1,
    professional_id: 1,
    exception_date: '2026-12-25',
    kind: 'unavailable',
    start_time: null,
    end_time: null,
    created_at: ISO,
    updated_at: ISO,
    ...overrides,
  }
}

export function makeServiceAreaPlaceRow(overrides: Partial<ServiceAreaPlaceRow> = {}): ServiceAreaPlaceRow {
  return {
    id: 31,
    service_id: 10,
    location_label: 'London, UK',
    place_id: 'mbx.2',
    ancestor_place_ids: [],
    latitude: 51.5,
    longitude: -0.12,
    geocoded_at: ISO,
    country_code: 'GB',
    created_at: ISO,
    ...overrides,
  }
}
