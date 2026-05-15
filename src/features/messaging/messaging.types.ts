import type { Database } from '@/types/database'

export type UserSnippet = Pick<
  Database['public']['Tables']['users']['Row'],
  'id' | 'first_name' | 'last_name' | 'profile_photo_url'
>

export type ConversationWithBooking = Database['public']['Tables']['conversations']['Row'] & {
  booking: Database['public']['Tables']['bookings']['Row'] & {
    client: UserSnippet
    professional: UserSnippet
    services: Pick<Database['public']['Tables']['services']['Row'], 'id' | 'title'> | null
  }
}

export type MessageRow = Database['public']['Tables']['messages']['Row']

export type ServiceOption = Pick<
  Database['public']['Tables']['services']['Row'],
  'id' | 'title' | 'description' | 'professional_id' | 'is_active'
>
