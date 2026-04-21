import type { Session } from '@supabase/supabase-js'
import { Link } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

export type AuthNavVariant = 'sheet' | 'mobile'

export type AuthNavActionsProps = {
  session: Session | null
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
      return <div className="px-4 pb-6">{logoutButton}</div>
    }

    return logoutButton
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
