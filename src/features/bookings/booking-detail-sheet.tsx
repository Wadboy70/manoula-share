import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'

import { buildBookingDetailSections } from './booking-detail-utils'
import { bookingStatusBadgeClass, bookingStatusLabel } from './booking-status'
import { counterpartyDisplayName, resolveConversationId } from './booking-utils'
import type { BookingDetailRow, BookingViewerRole } from './booking.types'
import { cn } from '@/lib/utils'

export type BookingDetailSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  booking: BookingDetailRow | null
  role: BookingViewerRole
  loading: boolean
  error: string | null
  bookingsListHref: string
  showProfessionalActions?: boolean
  actionBusy?: boolean
  onAccept?: () => void
  onDecline?: () => void
  onComplete?: () => void
}

export function BookingDetailSheet({
  open,
  onOpenChange,
  booking,
  role,
  loading,
  error,
  bookingsListHref,
  showProfessionalActions = false,
  actionBusy = false,
  onAccept,
  onDecline,
  onComplete,
}: BookingDetailSheetProps) {
  const title = booking?.services?.title ?? 'Booking details'
  const conversationId = booking ? resolveConversationId(booking.conversations) : null
  const sections = booking ? buildBookingDetailSections(booking, role) : []

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b border-white/10 pb-4">
          <SheetTitle className="pr-8 text-left">{title}</SheetTitle>
          <SheetDescription className="sr-only">
            Full details for this booking, including service and location information.
          </SheetDescription>
          {booking ? (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span
                className={cn(
                  'inline-flex rounded-full border px-2 py-0.5 text-xs font-medium',
                  bookingStatusBadgeClass(booking.status),
                )}
              >
                {bookingStatusLabel(booking.status)}
              </span>
              <span className="text-muted-foreground text-sm">
                with {counterpartyDisplayName(booking, role)}
              </span>
            </div>
          ) : null}
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 p-4">
          {loading ? (
            <p className="text-muted-foreground text-sm">Loading details…</p>
          ) : null}
          {error ? <p className="text-destructive text-sm">{error}</p> : null}

          {!loading && !error && booking ? (
            <>
              <dl className="space-y-3">
                {sections.map((section) => (
                  <div key={section.label}>
                    <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                      {section.label}
                    </dt>
                    <dd className="text-foreground mt-1 text-sm leading-relaxed">{section.value}</dd>
                  </div>
                ))}
              </dl>

              <Separator className="bg-white/10" />

              <div className="flex flex-col gap-2">
                <Link
                  to={bookingsListHref}
                  className={buttonVariants({
                    variant: 'outline',
                    className: 'rounded-none w-full justify-center',
                  })}
                  onClick={() => onOpenChange(false)}
                >
                  Back to bookings
                </Link>

                {conversationId != null ? (
                  <Link
                    to={`/messages/${conversationId}`}
                    className={buttonVariants({
                      className: 'rounded-none w-full justify-center',
                    })}
                    onClick={() => onOpenChange(false)}
                  >
                    Open messages
                  </Link>
                ) : null}

                {showProfessionalActions && booking.status === 'pending' ? (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={actionBusy}
                      className="flex-1 rounded-none"
                      onClick={() => onDecline?.()}
                    >
                      Decline
                    </Button>
                    <Button
                      type="button"
                      disabled={actionBusy}
                      className="flex-1 rounded-none"
                      onClick={() => onAccept?.()}
                    >
                      Accept
                    </Button>
                  </div>
                ) : null}

                {showProfessionalActions && booking.status === 'accepted' ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={actionBusy}
                    className="rounded-none w-full"
                    onClick={() => onComplete?.()}
                  >
                    Mark completed
                  </Button>
                ) : null}
              </div>
            </>
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  )
}
