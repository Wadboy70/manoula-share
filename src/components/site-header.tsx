import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Button, buttonVariants } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

function SearchField({ idPrefix }: { idPrefix: string }) {
  const [query, setQuery] = useState('')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
  }

  return (
    <form
      role="search"
      className="flex w-full items-center gap-2"
      onSubmit={onSubmit}
    >
      <label htmlFor={`${idPrefix}-search`} className="sr-only">
        Search providers or services
      </label>
      <Input
        id={`${idPrefix}-search`}
        type="search"
        placeholder="Search providers…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        autoComplete="off"
        className="border-white/20 bg-white/10 text-zinc-100 placeholder:text-zinc-500 focus-visible:ring-white/30"
      />
      <Button
        type="submit"
        size="sm"
        variant="secondary"
        className="shrink-0 bg-[#e5e5e5] text-black hover:bg-white"
      >
        Search
      </Button>
    </form>
  )
}

export function SiteHeader() {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

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
      <div className="relative mx-auto flex min-h-[5.5rem] w-full max-w-[1400px] items-center justify-end px-6 sm:px-8 md:min-h-0 md:py-10 md:px-10 lg:justify-between lg:py-12 lg:px-14">
        <Link
          to="/"
          className="font-brand absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center text-xl tracking-[0.28em] text-white uppercase lg:static lg:translate-x-0 lg:translate-y-0 lg:text-2xl"
        >
          MA NOULA
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          {session ? (
            <Button
              type="button"
              size="lg"
              onClick={() => {
                void onLogout()
              }}
              disabled={loggingOut}
              className="shrink-0 rounded-none bg-[#e5e5e5] px-8 text-black hover:bg-white"
            >
              {loggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          ) : (
            <>
              <Link
                to="/signin"
                className={cn(
                  buttonVariants({ size: 'lg', variant: 'outline' }),
                  'shrink-0 rounded-none border-white/80 bg-transparent px-8 text-white hover:bg-white/10',
                )}
              >
                Log in
              </Link>
              <Link
                to="/signup"
                className={cn(
                  buttonVariants({ size: 'lg' }),
                  'shrink-0 rounded-none bg-[#e5e5e5] px-8 text-black hover:bg-white',
                )}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 sm:px-8 lg:hidden">
        <SearchField idPrefix="mobile-bar" />
      </div>
    </header>
  )
}
