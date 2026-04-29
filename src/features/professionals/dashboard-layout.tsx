import { Link, Outlet, useLocation } from 'react-router-dom'

export function DashboardLayout() {
  const { pathname } = useLocation()
  const isNested =
    pathname.startsWith('/dashboard/') && pathname !== '/dashboard'

  return (
    <div className="bg-background flex min-h-0 flex-1 flex-col">
      <main id="main-content" className="font-body mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-6">
        {isNested ? (
          <nav className="mb-6" aria-label="Dashboard">
            <Link
              to="/dashboard"
              className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
            >
              ← Back to overview
            </Link>
          </nav>
        ) : null}
        <Outlet />
      </main>
    </div>
  )
}
