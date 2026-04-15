import { SiteHeader } from '@/components/site-header'

export function DashboardPage() {
  return (
    <div className="bg-background flex min-h-svh flex-col">
      <SiteHeader />
      <div className="font-body flex flex-1 items-center justify-center px-6 py-12">
        <h1 className="font-heading text-3xl text-white">Dashboard</h1>
      </div>
    </div>
  )
}
