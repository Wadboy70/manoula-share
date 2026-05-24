import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useAuth } from '@/features/auth'
import { BookingCard } from '@/features/bookings/booking-card'
import { useBookings } from '@/features/bookings/use-bookings'

import { ProfileIncompletePrompt } from './profile-incomplete-prompt'

const PREVIEW_LIMIT = 3

export function DashboardOverviewPage() {
  const { appUser } = useAuth()
  const profileIsComplete = appUser?.professionalSearchProfile?.is_profile_complete ?? false
  const {
    grouped,
    loading,
    error,
    actionBookingId,
    accept,
    decline,
  } = useBookings('professional', appUser?.id)

  const pendingPreview = grouped.pending.slice(0, PREVIEW_LIMIT)
  const upcomingPreview = grouped.upcoming.slice(0, PREVIEW_LIMIT)
  const pendingCount = grouped.pending.length
  const upcomingCount = grouped.upcoming.length
  const completedCount = grouped.completed.length

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl text-white md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Overview and control center—see what needs attention next.
        </p>
      </header>

      <ProfileIncompletePrompt
        variant="banner"
        percentage={profileIsComplete ? 100 : 60}
        isComplete={profileIsComplete}
        missingItems={
          profileIsComplete
            ? []
            : [
                'Finish your profile details',
                'Add credentials for trust',
              ]
        }
        ctaHref="/professional/onboarding"
      />

      <section aria-labelledby="dashboard-stats-heading">
        <h2 id="dashboard-stats-heading" className="sr-only">
          Quick stats
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle>Pending requests</CardTitle>
              <CardDescription>Awaiting your response</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-heading text-2xl text-white tabular-nums">
                {loading ? '—' : pendingCount}
              </p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle>Upcoming</CardTitle>
              <CardDescription>Accepted sessions</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-heading text-2xl text-white tabular-nums">
                {loading ? '—' : upcomingCount}
              </p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle>Completed</CardTitle>
              <CardDescription>All-time on Manoula</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-heading text-2xl text-white tabular-nums">
                {loading ? '—' : completedCount}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="dashboard-notifications-heading">
        <Card>
          <CardHeader>
            <CardTitle id="dashboard-notifications-heading">Notifications</CardTitle>
            <CardDescription>Booking activity at a glance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-foreground">New booking requests</span>
              <span className="text-muted-foreground font-medium tabular-nums">
                {loading ? '—' : pendingCount}
              </span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-foreground">Upcoming sessions</span>
              <span className="text-muted-foreground font-medium tabular-nums">
                {loading ? '—' : upcomingCount}
              </span>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="dashboard-upcoming-heading">
          <Card className="h-full">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle id="dashboard-upcoming-heading">Upcoming bookings</CardTitle>
                <CardDescription>Accepted sessions on your calendar.</CardDescription>
              </div>
              <Link
                to="/dashboard/bookings"
                className={buttonVariants({ size: 'sm', variant: 'outline', className: 'rounded-none' })}
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : upcomingPreview.length === 0 ? (
                <p className="text-muted-foreground text-sm">No upcoming sessions.</p>
              ) : (
                <ul className="space-y-3">
                  {upcomingPreview.map((booking) => (
                    <li key={booking.id}>
                      <BookingCard booking={booking} role="professional" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="dashboard-pending-heading">
          <Card className="h-full">
            <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle id="dashboard-pending-heading">Pending booking requests</CardTitle>
                <CardDescription>Accept or decline new consultation requests.</CardDescription>
              </div>
              <Link
                to="/dashboard/bookings"
                className={buttonVariants({ size: 'sm', variant: 'outline', className: 'rounded-none' })}
              >
                View all
              </Link>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <p className="text-muted-foreground text-sm">Loading…</p>
              ) : error ? (
                <p className="text-destructive text-sm">{error}</p>
              ) : pendingPreview.length === 0 ? (
                <p className="text-muted-foreground text-sm">No pending requests.</p>
              ) : (
                <ul className="space-y-3">
                  {pendingPreview.map((booking) => (
                    <li key={booking.id}>
                      <BookingCard
                        booking={booking}
                        role="professional"
                        showActions
                        actionBusy={actionBookingId === booking.id}
                        onAccept={() => {
                          void accept(booking.id)
                        }}
                        onDecline={() => {
                          void decline(booking.id)
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="dashboard-manage-heading">
        <Card>
          <CardHeader>
            <CardTitle id="dashboard-manage-heading">Manage your business</CardTitle>
            <CardDescription>Profile, services, bookings, and settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/dashboard/bookings"
                className={buttonVariants({ variant: 'outline', className: 'rounded-none sm:min-w-[10rem]' })}
              >
                Bookings
              </Link>
              <Link
                to="/dashboard/profile"
                className={buttonVariants({ variant: 'outline', className: 'rounded-none sm:min-w-[10rem]' })}
              >
                Profile
              </Link>
              <Link
                to="/dashboard/services"
                className={buttonVariants({ variant: 'outline', className: 'rounded-none sm:min-w-[10rem]' })}
              >
                Services
              </Link>
              <Link
                to="/dashboard/settings"
                className={buttonVariants({ variant: 'outline', className: 'rounded-none sm:min-w-[10rem]' })}
              >
                Settings
              </Link>
            </div>
          </CardContent>
          <CardFooter className="text-muted-foreground text-xs">
            Bookings sync with your message threads for each consultation.
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
