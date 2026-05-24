import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import type { AppUser } from '@/types/auth'

import { getProfessionalNavCta } from '@/features/professionals/professional-user-utils'

export type AuthNavVariant = 'sheet' | 'mobile'

export type AuthNavActionsProps = {
  session: Session | null
  /** Loaded app user row; used with `session` for Dashboard / Join CTA (no extra fetch). */
  appUser: AppUser | null
  /** When true, professional CTA is hidden until `appUser` is reliable. */
  authLoading: boolean
  loggingOut: boolean
  onLogout: () => void | Promise<void>
  variant: AuthNavVariant
  /** Close sheet / dismiss overlays after navigation */
  onAfterNavigate?: () => void
}

function afterNav(onAfterNavigate: AuthNavActionsProps['onAfterNavigate']) {
  onAfterNavigate?.()
}

export function AuthNavActions({
  session,
  appUser,
  authLoading,
  loggingOut,
  onLogout,
  variant,
  onAfterNavigate,
}: AuthNavActionsProps) {
  const isSheet = variant === 'sheet'

  const outlineLinkClass = cn(
    buttonVariants({ size: isSheet ? 'lg' : 'default', variant: 'outline' }),
    'rounded-none border-white/80 bg-transparent text-white hover:bg-white/10',
    isSheet ? 'w-full justify-center px-8' : 'min-h-11 flex-1 justify-center px-3',
  )

  const primaryLinkClass = cn(
    buttonVariants({ size: isSheet ? 'lg' : 'default' }),
    'rounded-none bg-[#e5e5e5] px-8 text-black hover:bg-white',
    isSheet ? 'w-full justify-center' : 'min-h-11 flex-1 justify-center px-3',
  )

  const logoutClass = cn(
    buttonVariants({ size: isSheet ? 'lg' : 'default' }),
    'rounded-none bg-[#e5e5e5] text-black hover:bg-white',
    isSheet ? 'w-full px-8' : 'min-h-11 w-full flex-1',
  )

  const showProfessionalCta =
    Boolean(session) && !authLoading && appUser !== null

  const professionalNavCta =
    showProfessionalCta && appUser ? getProfessionalNavCta(appUser) : null

  const professionalCta = professionalNavCta ? (
    <Link
      to={professionalNavCta.href}
      className={professionalNavCta.href === '/dashboard' ? primaryLinkClass : outlineLinkClass}
      onClick={() => afterNav(onAfterNavigate)}
    >
      {professionalNavCta.label}
    </Link>
  ) : null

  const messagesLink = session ? (
    <Link
      to="/messages"
      className={outlineLinkClass}
      onClick={() => afterNav(onAfterNavigate)}
    >
      Messages
    </Link>
  ) : null

  const bookingsLink =
    session && appUser && !appUser.is_professional ? (
      <Link
        to="/bookings"
        className={outlineLinkClass}
        onClick={() => afterNav(onAfterNavigate)}
      >
        Bookings
      </Link>
    ) : null

  if (session) {
    const logoutButton = (
      <Button
        type="button"
        size={isSheet ? 'lg' : 'default'}
        onClick={() => {
          void onLogout()
          afterNav(onAfterNavigate)
        }}
        disabled={loggingOut}
        className={logoutClass}
      >
        {loggingOut ? 'Logging out...' : 'Logout'}
      </Button>
    )

    if (isSheet) {
      return (
        <div className="flex flex-col gap-3 px-4 pb-6">
          {messagesLink}
          {bookingsLink}
          {professionalCta}
          {logoutButton}
        </div>
      )
    }

    return (
      <div className="flex w-full max-w-lg flex-col gap-2 sm:mx-auto">
        {messagesLink ? (
          <div className="flex min-h-11 w-full items-stretch">{messagesLink}</div>
        ) : null}
        {bookingsLink ? (
          <div className="flex min-h-11 w-full items-stretch">{bookingsLink}</div>
        ) : null}
        {professionalCta ? (
          <div className="flex min-h-11 w-full items-stretch">{professionalCta}</div>
        ) : null}
        <div className="flex min-h-11 w-full items-stretch">{logoutButton}</div>
      </div>
    )
  }

  if (isSheet) {
    return (
      <div className="flex flex-col gap-3 px-4 pb-6">
        <Link
          to="/signin"
          className={outlineLinkClass}
          onClick={() => afterNav(onAfterNavigate)}
        >
          Log in
        </Link>
        <Link
          to="/signup"
          className={primaryLinkClass}
          onClick={() => afterNav(onAfterNavigate)}
        >
          Sign up
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-11 w-full max-w-lg items-stretch justify-center gap-2 sm:mx-auto">
      <Link
        to="/signin"
        className={outlineLinkClass}
        onClick={() => afterNav(onAfterNavigate)}
      >
        Log in
      </Link>
      <Separator orientation="vertical" className="my-1.5 bg-white/20" />
      <Link
        to="/signup"
        className={primaryLinkClass}
        onClick={() => afterNav(onAfterNavigate)}
      >
        Sign up
      </Link>
    </div>
  )
}
