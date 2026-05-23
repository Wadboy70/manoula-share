import { useCallback, useState } from 'react'

import { fetchBookingDetail } from './booking.service'
import type { BookingDetailRow } from './booking.types'

export function useBookingDetail() {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<BookingDetailRow | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const openDetail = useCallback(async (bookingId: number) => {
    setOpen(true)
    setLoading(true)
    setError(null)
    setDetail(null)

    const { data, error: err } = await fetchBookingDetail(bookingId)
    setLoading(false)

    if (err) {
      setError(err.message)
      return
    }

    if (!data) {
      setError('Booking not found or you do not have access.')
      return
    }

    setDetail(data)
  }, [])

  const refreshDetail = useCallback(async () => {
    if (!detail) return
    const { data, error: err } = await fetchBookingDetail(detail.id)
    if (err) {
      setError(err.message)
      return
    }
    if (data) {
      setDetail(data)
      setError(null)
    }
  }, [detail])

  return {
    open,
    setOpen,
    detail,
    loading,
    error,
    openDetail,
    refreshDetail,
  }
}
