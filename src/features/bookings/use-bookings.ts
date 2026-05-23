import { useCallback, useEffect, useState } from 'react'

import {
  acceptBooking,
  completeBooking,
  declineBooking,
  fetchBookingsForUser,
} from './booking.service'
import { groupBookingsByTab } from './booking-utils'
import type { BookingListRow, BookingViewerRole } from './booking.types'

export function useBookings(role: BookingViewerRole, userId: number | undefined) {
  const [bookings, setBookings] = useState<BookingListRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionBookingId, setActionBookingId] = useState<number | null>(null)

  const reload = useCallback(async () => {
    if (userId == null) {
      setBookings([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    const { data, error: err } = await fetchBookingsForUser(role, userId)
    setLoading(false)

    if (err) {
      setError(err.message)
      setBookings([])
      return
    }

    setBookings(data ?? [])
  }, [role, userId])

  useEffect(() => {
    queueMicrotask(() => {
      void reload()
    })
  }, [reload])

  const grouped = groupBookingsByTab(bookings)

  async function runAction(
    bookingId: number,
    action: () => Promise<{ error: Error | null }>,
  ): Promise<boolean> {
    setActionBookingId(bookingId)
    const { error: err } = await action()
    setActionBookingId(null)

    if (err) {
      setError(err.message)
      return false
    }

    await reload()
    return true
  }

  return {
    bookings,
    grouped,
    loading,
    error,
    actionBookingId,
    reload,
    accept: (bookingId: number) => runAction(bookingId, () => acceptBooking(bookingId)),
    decline: (bookingId: number) => runAction(bookingId, () => declineBooking(bookingId)),
    complete: (bookingId: number) => runAction(bookingId, () => completeBooking(bookingId)),
  }
}
