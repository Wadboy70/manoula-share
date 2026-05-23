import {
  buildPathWithSearchParam,
  defineSearchParam,
  searchParamCodecs,
} from '@/lib/search-params'

import type { BookingViewerRole } from './booking.types'

/** Search param used to deep-link a booking detail sheet on the bookings page. */
export const bookingIdParam = defineSearchParam('booking', searchParamCodecs.positiveInt)

/** @deprecated Use `bookingIdParam.key` */
export const BOOKING_ID_SEARCH_PARAM = bookingIdParam.key

export function bookingsPath(role: BookingViewerRole, bookingId?: number | null): string {
  const base = role === 'professional' ? '/dashboard/bookings' : '/bookings'
  return buildPathWithSearchParam(base, bookingIdParam, bookingId ?? null)
}

/** @deprecated Use `parseSearchParam(bookingIdParam, raw)` from `@/lib/search-params` */
export function parseBookingIdParam(raw: string | null): number | null {
  return bookingIdParam.codec.parse(raw)
}
