import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'

import { AuthNavActions } from '@/components/auth-nav-actions'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { useAuth } from '@/features/auth'

export function SiteHeader() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  async function onLogout() {
    setLoggingOut(true)
    try {
      await signOut()
    } finally {
      setLoggingOut(false)
      navigate('/')
    }
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a1a] text-zinc-200">
      <div className="mx-auto flex min-h-[4.5rem] w-full max-w-[1400px] items-center justify-center px-6 sm:px-8 md:min-h-[5.5rem] md:justify-between md:px-10 md:py-8 lg:px-14 lg:py-10">
        <Link
          to="/"
          className="font-brand text-center text-xl tracking-[0.28em] text-white uppercase md:text-2xl"
        >
          MA NOULA
        </Link>

        <div className="hidden md:flex md:items-center md:justify-end">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="rounded-none border-white/80 text-white hover:bg-white/10"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" aria-hidden />
                </Button>
              }
            />
            <SheetContent side="right" className="w-full max-w-sm border-white/10 bg-[#1a1a1a] p-0 text-zinc-200">
              <SheetHeader className="border-b border-white/10 px-4 py-4 text-left">
                <SheetTitle className="font-heading text-lg text-white">Account</SheetTitle>
              </SheetHeader>
              <AuthNavActions
                session={session}
                loggingOut={loggingOut}
                onLogout={onLogout}
                variant="sheet"
                onAfterNavigate={() => setMenuOpen(false)}
              />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
