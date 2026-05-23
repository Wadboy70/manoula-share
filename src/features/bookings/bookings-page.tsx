import { useAuth } from '@/features/auth'

import { BookingList } from './booking-list'
import type { BookingViewerRole } from './booking.types'
import { useBookings } from './use-bookings'

export type BookingsPageProps = {
  role: BookingViewerRole
  title: string
  description: string
}

export function BookingsPage({ role, title, description }: BookingsPageProps) {
  const { appUser } = useAuth()
  const {
    grouped,
    loading,
    error,
    actionBookingId,
    reload,
    accept,
    decline,
    complete,
  } = useBookings(role, appUser?.id)

  const showProfessionalActions = role === 'professional'

  return (
    <div className="bg-background font-body mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6">
      <header>
        <h1 className="font-heading text-2xl text-white md:text-3xl">{title}</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          {description}
        </p>
      </header>

      <BookingList
        role={role}
        grouped={grouped}
        loading={loading}
        error={error}
        actionBookingId={actionBookingId}
        showProfessionalActions={showProfessionalActions}
        onRetry={() => {
          void reload()
        }}
        onAccept={(id) => accept(id)}
        onDecline={(id) => decline(id)}
        onComplete={(id) => complete(id)}
      />
    </div>
  )
}
