import { Link } from 'react-router-dom'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type DashboardPlaceholderPageProps = {
  title: string
}

export function DashboardPlaceholderPage({ title }: DashboardPlaceholderPageProps) {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            This area is a placeholder. Editing tools for {title.toLowerCase()} will be added
            later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Coming soon—you can return to the overview anytime.
          </p>
        </CardContent>
        <CardFooter>
          <Link
            to="/dashboard"
            className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
          >
            ← Back to dashboard overview
          </Link>
        </CardFooter>
      </Card>
    </div>
  )
}

export function DashboardProfilePlaceholderPage() {
  return <DashboardPlaceholderPage title="Profile" />
}

export function DashboardServicesPlaceholderPage() {
  return <DashboardPlaceholderPage title="Services" />
}

export function DashboardSettingsPlaceholderPage() {
  return <DashboardPlaceholderPage title="Settings" />
}
