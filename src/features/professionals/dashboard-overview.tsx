import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
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

import { ProfileIncompletePrompt } from './profile-incomplete-prompt'

const PLACEHOLDER_BOOKINGS = [
  { id: '1', label: 'Postnatal check-in', when: 'Tomorrow · 10:00' },
  { id: '2', label: 'Nutrition follow-up', when: 'Wed 14 May · 15:30' },
  { id: '3', label: 'Lactation support (virtual)', when: 'Fri 16 May · 09:00' },
]

const PLACEHOLDER_REQUESTS = [
  { id: 'a', client: 'Alex M.', service: 'Initial consultation', when: 'Requested 2h ago' },
  { id: 'b', client: 'Jordan K.', service: 'Follow-up session', when: 'Requested yesterday' },
]

export function DashboardOverviewPage() {
  const { appUser } = useAuth()
  const profileIsComplete = appUser?.professionalSearchProfile?.is_profile_complete ?? false

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="font-heading text-2xl text-white md:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-relaxed">
          Overview and control center—see what needs attention next. Live data will connect here
          in a later iteration.
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
                'Set visibility to public when ready',
              ]
        }
      />

      <section aria-labelledby="dashboard-stats-heading">
        <h2 id="dashboard-stats-heading" className="sr-only">
          Quick stats
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card size="sm">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle>Total bookings</CardTitle>
              <CardDescription>All-time (placeholder)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-heading text-2xl text-white">—</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle>Rating</CardTitle>
              <CardDescription>Average from reviews (placeholder)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-heading text-2xl text-white">—</p>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader className="border-b border-white/5 pb-3">
              <CardTitle>Response time</CardTitle>
              <CardDescription>Typical first reply (placeholder)</CardDescription>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-heading text-2xl text-white">—</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="dashboard-notifications-heading">
        <Card>
          <CardHeader>
            <CardTitle id="dashboard-notifications-heading">Notifications</CardTitle>
            <CardDescription>New activity since you last checked (static preview).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <span className="text-foreground">New messages</span>
              <span className="text-muted-foreground font-medium tabular-nums">0</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <span className="text-foreground">New booking requests</span>
              <span className="text-muted-foreground font-medium tabular-nums">0</span>
            </div>
          </CardContent>
        </Card>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="dashboard-upcoming-heading">
          <Card className="h-full">
            <CardHeader>
              <CardTitle id="dashboard-upcoming-heading">Upcoming bookings</CardTitle>
              <CardDescription>Next few sessions on your calendar (sample rows).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ul className="space-y-3">
                {PLACEHOLDER_BOOKINGS.map((row) => (
                  <li
                    key={row.id}
                    className="border-foreground/10 flex flex-col gap-0.5 rounded-lg border px-3 py-2"
                  >
                    <span className="text-foreground font-medium">{row.label}</span>
                    <span className="text-muted-foreground text-xs">{row.when}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </section>

        <section aria-labelledby="dashboard-pending-heading">
          <Card className="h-full">
            <CardHeader>
              <CardTitle id="dashboard-pending-heading">Pending booking requests</CardTitle>
              <CardDescription>Accept or decline when booking workflows are wired up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {PLACEHOLDER_REQUESTS.map((row) => (
                <div
                  key={row.id}
                  className="border-foreground/10 flex flex-col gap-3 rounded-lg border px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <p className="text-foreground font-medium">{row.client}</p>
                    <p className="text-muted-foreground text-sm">{row.service}</p>
                    <p className="text-muted-foreground mt-1 text-xs">{row.when}</p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button type="button" size="sm" variant="outline" disabled className="rounded-none">
                      Decline
                    </Button>
                    <Button type="button" size="sm" disabled className="rounded-none">
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </div>

      <section aria-labelledby="dashboard-manage-heading">
        <Card>
          <CardHeader>
            <CardTitle id="dashboard-manage-heading">Manage your business</CardTitle>
            <CardDescription>
              Profile, services, and settings—placeholder destinations until editors ship.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
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
            Buttons above navigate to stub pages under /dashboard.
          </CardFooter>
        </Card>
      </section>
    </div>
  )
}
