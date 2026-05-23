import { useCallback, useState } from 'react'

import { useSearchParam, useSearchParamEffect } from '@/lib/use-search-param'
import { cn } from '@/lib/utils'

import { BookingCard } from './booking-card'
import { BookingDetailSheet } from './booking-detail-sheet'
import { bookingIdParam, bookingsPath } from './booking-routes'
import type { BookingListRow, BookingTab, BookingViewerRole } from './booking.types'
import { tabForBookingId } from './booking-utils'
import { useBookingDetail } from './use-booking-detail'

const TAB_LABELS: Record<BookingTab, string> = {
  pending: 'Pending',
  upcoming: 'Upcoming',
  completed: 'Completed',
}

const EMPTY_COPY: Record<BookingTab, string> = {
  pending: 'No pending requests.',
  upcoming: 'No upcoming sessions.',
  completed: 'No completed sessions yet.',
}

export type BookingListProps = {
  role: BookingViewerRole
  grouped: Record<BookingTab, BookingListRow[]>
  loading: boolean
  error: string | null
  actionBookingId: number | null
  showProfessionalActions?: boolean
  onRetry: () => void
  onAccept?: (bookingId: number) => void | Promise<void>
  onDecline?: (bookingId: number) => void | Promise<void>
  onComplete?: (bookingId: number) => void | Promise<void>
}

export function BookingList({
  role,
  grouped,
  loading,
  error,
  actionBookingId,
  showProfessionalActions = false,
  onRetry,
  onAccept,
  onDecline,
  onComplete,
}: BookingListProps) {
  const { value: bookingIdFromUrl, setValue: setBookingInUrl, clearValue: clearBookingInUrl } =
    useSearchParam(bookingIdParam)
  const [tab, setTab] = useState<BookingTab>('pending')
  const rows = grouped[tab]
  const {
    open: detailOpen,
    setOpen: setDetailOpen,
    detail,
    loading: detailLoading,
    error: detailError,
    openDetail,
    refreshDetail,
  } = useBookingDetail()

  const handleDetailOpenChange = useCallback(
    (open: boolean) => {
      if (open) {
        setDetailOpen(true)
        return
      }
      setDetailOpen(false)
      clearBookingInUrl({ replace: true })
    },
    [clearBookingInUrl, setDetailOpen],
  )

  const handleViewDetails = useCallback(
    (bookingId: number) => {
      setBookingInUrl(bookingId, { replace: false })
      void openDetail(bookingId)
    },
    [openDetail, setBookingInUrl],
  )

  useSearchParamEffect(bookingIdFromUrl, {
    ready: !loading,
    onChange: useCallback(
      (bookingId) => {
        if (bookingId == null) {
          setDetailOpen(false)
          return
        }

        const tabForBooking = tabForBookingId(grouped, bookingId)
        if (tabForBooking) setTab(tabForBooking)

        if (detail?.id !== bookingId || !detailOpen) {
          void openDetail(bookingId)
        }
      },
      [detail?.id, detailOpen, grouped, openDetail, setDetailOpen],
    ),
  })

  async function handleAccept(bookingId: number) {
    await Promise.resolve(onAccept?.(bookingId))
    if (detail?.id === bookingId) await refreshDetail()
  }

  async function handleDecline(bookingId: number) {
    await Promise.resolve(onDecline?.(bookingId))
    if (detail?.id === bookingId) await refreshDetail()
  }

  async function handleComplete(bookingId: number) {
    await Promise.resolve(onComplete?.(bookingId))
    if (detail?.id === bookingId) await refreshDetail()
  }

  if (loading) {
    return <p className="text-muted-foreground text-sm">Loading bookings…</p>
  }

  if (error) {
    return (
      <div className="text-sm">
        <p className="text-destructive">{error}</p>
        <button type="button" className="text-primary mt-2 underline" onClick={onRetry}>
          Try again
        </button>
      </div>
    )
  }

  return (
    <>
    <div className="flex flex-col gap-6">
      <div
        className="flex flex-wrap gap-2"
        role="tablist"
        aria-label="Booking sections"
      >
        {(Object.keys(TAB_LABELS) as BookingTab[]).map((key) => {
          const count = grouped[key].length
          const active = tab === key
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              className={cn(
                'rounded-none border px-3 py-1.5 text-sm transition-colors',
                active
                  ? 'border-white/30 bg-white/10 text-white'
                  : 'border-white/10 text-muted-foreground hover:border-white/20 hover:text-white',
              )}
              onClick={() => setTab(key)}
            >
              {TAB_LABELS[key]}
              {count > 0 ? (
                <span className="text-muted-foreground ml-1.5 tabular-nums">({count})</span>
              ) : null}
            </button>
          )
        })}
      </div>

      {rows.length === 0 ? (
        <p className="text-muted-foreground text-sm">{EMPTY_COPY[tab]}</p>
      ) : (
        <ul className="space-y-3" role="tabpanel">
          {rows.map((booking) => (
            <li key={booking.id}>
              <BookingCard
                booking={booking}
                role={role}
                showActions={showProfessionalActions}
                actionBusy={actionBookingId === booking.id}
                onViewDetails={() => {
                  handleViewDetails(booking.id)
                }}
                onAccept={() => {
                  void handleAccept(booking.id)
                }}
                onDecline={() => {
                  void handleDecline(booking.id)
                }}
                onComplete={() => {
                  void handleComplete(booking.id)
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>

    <BookingDetailSheet
      open={detailOpen}
      onOpenChange={handleDetailOpenChange}
      booking={detail}
      role={role}
      loading={detailLoading}
      error={detailError}
      bookingsListHref={bookingsPath(role)}
      showProfessionalActions={showProfessionalActions}
      actionBusy={detail != null && actionBookingId === detail.id}
      onAccept={() => {
        if (detail) void handleAccept(detail.id)
      }}
      onDecline={() => {
        if (detail) void handleDecline(detail.id)
      }}
      onComplete={() => {
        if (detail) void handleComplete(detail.id)
      }}
    />
    </>
  )
}
