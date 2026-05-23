import type { Database } from '@/types/database'

import type { UserSnippet } from '@/features/messaging/messaging.types'

export type BookingStatus = Database['public']['Enums']['booking_status']

type BookingServiceListFields = Pick<
  Database['public']['Tables']['services']['Row'],
  'id' | 'title' | 'delivery_mode'
>

type BookingServiceDetailFields = Pick<
  Database['public']['Tables']['services']['Row'],
  | 'id'
  | 'title'
  | 'description'
  | 'delivery_mode'
  | 'remote_scope'
  | 'provider_location_name'
  | 'service_area_type'
  | 'service_area_text'
  | 'service_radius_km'
  | 'duration_minutes'
  | 'price_cents'
  | 'currency_code'
> & {
  service_provider_locations: Pick<
    Database['public']['Tables']['service_provider_locations']['Row'],
    'location_name' | 'location_label'
  >[]
  service_area_places: Pick<
    Database['public']['Tables']['service_area_places']['Row'],
    'location_label'
  >[]
}

type ProfessionalProfileSnippet = Pick<
  Database['public']['Tables']['professional_search_profiles']['Row'],
  'location_label'
>

export type BookingListRow = Database['public']['Tables']['bookings']['Row'] & {
  client: UserSnippet
  professional: UserSnippet
  services: BookingServiceListFields | null
  conversations: { id: number } | { id: number }[] | null
}

export type BookingDetailRow = Database['public']['Tables']['bookings']['Row'] & {
  client: UserSnippet
  professional: UserSnippet & {
    professional_search_profiles:
      | ProfessionalProfileSnippet
      | ProfessionalProfileSnippet[]
      | null
  }
  services: BookingServiceDetailFields | null
  conversations: { id: number } | { id: number }[] | null
}

export type BookingViewerRole = 'professional' | 'client'

export type BookingTab = 'pending' | 'upcoming' | 'completed'

export const BOOKING_TAB_STATUSES: Record<BookingTab, BookingStatus[]> = {
  pending: ['pending'],
  upcoming: ['accepted'],
  completed: ['completed'],
}
