import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  DELIVERY_MODE_LABELS,
  type DeliveryMode,
} from '@/features/search/delivery-mode-filter'
import { cn } from '@/lib/utils'

import { formatBookingTimestamp } from './booking-detail-utils'
import { bookingStatusBadgeClass, bookingStatusLabel } from './booking-status'
import {
  counterpartyDisplayName,
  resolveConversationId,
} from './booking-utils'
import type { BookingListRow, BookingViewerRole } from './booking.types'

export type BookingCardProps = {
  booking: BookingListRow
  role: BookingViewerRole
  showActions?: boolean
  actionBusy?: boolean
  onViewDetails?: () => void
  onAccept?: () => void
  onDecline?: () => void
  onComplete?: () => void
}

function deliveryModeLabel(mode: string | undefined): string | null {
  if (!mode) return null
  if (mode in DELIVERY_MODE_LABELS) {
    return DELIVERY_MODE_LABELS[mode as DeliveryMode]
  }
  return null
}

export function BookingCard({
  booking,
  role,
  showActions = false,
  actionBusy = false,
  onViewDetails,
  onAccept,
  onDecline,
  onComplete,
}: BookingCardProps) {
  const conversationId = resolveConversationId(booking.conversations)
  const serviceTitle = booking.services?.title ?? 'Consultation'
  const deliveryLabel = deliveryModeLabel(booking.services?.delivery_mode)
  const requestedTime = formatBookingTimestamp(booking.scheduled_at)

  return (
    <article className="border-foreground/10 flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        className="min-w-0 flex-1 rounded-md text-left transition-colors hover:bg-white/5 focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:outline-none"
        onClick={() => onViewDetails?.()}
      >
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-foreground font-medium">{counterpartyDisplayName(booking, role)}</p>
          <span
            className={cn(
              'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
              bookingStatusBadgeClass(booking.status),
            )}
          >
            {bookingStatusLabel(booking.status)}
          </span>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">{serviceTitle}</p>
        {requestedTime &&
        (booking.status === 'pending' || booking.status === 'accepted') ? (
          <p className="text-muted-foreground mt-0.5 text-xs">Requested: {requestedTime}</p>
        ) : null}
        {deliveryLabel ? (
          <p className="text-muted-foreground mt-0.5 text-xs">{deliveryLabel}</p>
        ) : null}
        <p className="text-muted-foreground mt-1.5 text-xs underline-offset-2 hover:underline">
          View details
        </p>
      </button>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {conversationId != null ? (
          <Link
            to={`/messages/${conversationId}`}
            className={buttonVariants({ size: 'sm', variant: 'outline', className: 'rounded-none' })}
          >
            Message
          </Link>
        ) : null}

        {showActions && booking.status === 'pending' ? (
          <>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={actionBusy}
              className="rounded-none"
              onClick={() => onDecline?.()}
            >
              Decline
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={actionBusy}
              className="rounded-none"
              onClick={() => onAccept?.()}
            >
              Accept
            </Button>
          </>
        ) : null}

        {showActions && booking.status === 'accepted' ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={actionBusy}
            className="rounded-none"
            onClick={() => onComplete?.()}
          >
            Mark completed
          </Button>
        ) : null}
      </div>
    </article>
  )
}
