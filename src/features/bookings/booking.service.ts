import { supabase } from '@/lib/supabaseClient'

import type {
  BookingDetailRow,
  BookingListRow,
  BookingStatus,
  BookingViewerRole,
} from './booking.types'

const BOOKING_LIST_SELECT = `
  id,
  client_id,
  professional_id,
  service_id,
  status,
  created_at,
  updated_at,
  scheduled_at,
  client:users!bookings_client_id_fkey ( id, first_name, last_name, profile_photo_url ),
  professional:users!bookings_professional_id_fkey ( id, first_name, last_name, profile_photo_url ),
  services ( id, title, delivery_mode ),
  conversations ( id )
`

const BOOKING_DETAIL_SELECT = `
  id,
  client_id,
  professional_id,
  service_id,
  status,
  created_at,
  updated_at,
  scheduled_at,
  client:users!bookings_client_id_fkey ( id, first_name, last_name, profile_photo_url ),
  professional:users!bookings_professional_id_fkey (
    id,
    first_name,
    last_name,
    profile_photo_url,
    professional_search_profiles ( location_label )
  ),
  services (
    id,
    title,
    description,
    delivery_mode,
    remote_scope,
    provider_location_name,
    service_area_type,
    service_area_text,
    service_radius_km,
    duration_minutes,
    price_cents,
    currency_code,
    service_provider_locations ( location_name, location_label ),
    service_area_places ( location_label )
  ),
  conversations ( id )
`

const LIST_STATUSES: BookingStatus[] = ['pending', 'accepted', 'completed']

export async function fetchBookingsForUser(
  role: BookingViewerRole,
  userId: number,
): Promise<{ data: BookingListRow[] | null; error: Error | null }> {
  const column = role === 'professional' ? 'professional_id' : 'client_id'

  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_LIST_SELECT)
    .eq(column, userId)
    .in('status', LIST_STATUSES)
    .order('created_at', { ascending: false })

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  return { data: (data ?? []) as unknown as BookingListRow[], error: null }
}

export async function fetchBookingDetail(
  bookingId: number,
): Promise<{ data: BookingDetailRow | null; error: Error | null }> {
  const { data, error } = await supabase
    .from('bookings')
    .select(BOOKING_DETAIL_SELECT)
    .eq('id', bookingId)
    .maybeSingle()

  if (error) {
    return { data: null, error: new Error(error.message) }
  }

  if (!data) {
    return { data: null, error: null }
  }

  return { data: data as unknown as BookingDetailRow, error: null }
}

async function updateBookingStatus(
  bookingId: number,
  status: BookingStatus,
): Promise<{ error: Error | null }> {
  const { error } = await supabase.rpc('update_booking_status', {
    p_booking_id: bookingId,
    p_status: status,
  })

  if (error) {
    return { error: new Error(error.message) }
  }

  return { error: null }
}

export function acceptBooking(bookingId: number) {
  return updateBookingStatus(bookingId, 'accepted')
}

export function declineBooking(bookingId: number) {
  return updateBookingStatus(bookingId, 'declined')
}

export function completeBooking(bookingId: number) {
  return updateBookingStatus(bookingId, 'completed')
}
