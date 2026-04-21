import { Outlet, useLocation } from 'react-router-dom'

import { MobileAuthNav } from '@/components/mobile-auth-nav'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'

export function SiteChrome() {
  const { pathname } = useLocation()

  return (
    <div className="bg-background flex min-h-svh flex-col">
      <SiteHeader />
      <div className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
      {pathname === '/' ? <SiteFooter /> : null}
      <div className="h-16 shrink-0 md:hidden" aria-hidden />
      <MobileAuthNav />
    </div>
  )
}
