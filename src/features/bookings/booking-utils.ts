import { displayName } from '@/features/messaging/messaging-utils'

import type { BookingListRow, BookingTab, BookingViewerRole } from './booking.types'

export function resolveConversationId(
  conversations: BookingListRow['conversations'],
): number | null {
  if (!conversations) return null
  if (Array.isArray(conversations)) {
    return conversations[0]?.id ?? null
  }
  return conversations.id
}

export function counterpartyForRole(
  booking: BookingListRow,
  role: BookingViewerRole,
): BookingListRow['client'] {
  return role === 'professional' ? booking.client : booking.professional
}

export function counterpartyDisplayName(
  booking: BookingListRow,
  role: BookingViewerRole,
): string {
  return displayName(counterpartyForRole(booking, role))
}

export function tabForBookingId(
  grouped: Record<BookingTab, BookingListRow[]>,
  bookingId: number,
): BookingTab | null {
  if (grouped.pending.some((b) => b.id === bookingId)) return 'pending'
  if (grouped.upcoming.some((b) => b.id === bookingId)) return 'upcoming'
  if (grouped.completed.some((b) => b.id === bookingId)) return 'completed'
  return null
}

export function groupBookingsByTab(
  bookings: BookingListRow[],
): Record<'pending' | 'upcoming' | 'completed', BookingListRow[]> {
  const pending: BookingListRow[] = []
  const upcoming: BookingListRow[] = []
  const completed: BookingListRow[] = []

  for (const row of bookings) {
    if (row.status === 'pending') pending.push(row)
    else if (row.status === 'accepted') upcoming.push(row)
    else if (row.status === 'completed') completed.push(row)
  }

  pending.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
  upcoming.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))
  completed.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at))

  return { pending, upcoming, completed }
}
