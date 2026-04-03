import { useState, type FormEvent } from 'react'
import { Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '#home', label: 'Home', active: true },
  { href: '#about', label: 'About', active: false },
  { href: '#specialties', label: 'Services', active: false },
  { href: '#how-it-works', label: 'Appointments', active: false },
  { href: '#stories', label: 'Stories', active: false },
  { href: '#contact', label: 'Contact', active: false },
] as const

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

function NavLinks({
  className,
  variant = 'desktop',
}: {
  className?: string
  variant?: 'desktop' | 'mobile'
}) {
  return (
    <nav
      className={cn(
        'flex flex-col gap-1',
        variant === 'desktop' &&
          'flex-row flex-wrap items-center gap-x-4 gap-y-1 lg:gap-x-8',
        className,
      )}
      aria-label="Main"
    >
      {navLinks.map((link) => (
        <a
          key={link.href}
          href={link.href}
          className={cn(
            'font-body text-[11px] font-normal tracking-[0.12em] uppercase transition-colors',
            variant === 'desktop' && 'text-zinc-300 hover:text-white',
            variant === 'mobile' &&
              'font-body py-2 text-zinc-200 hover:text-white',
            link.active &&
              variant === 'desktop' &&
              'border-b border-white pb-0.5 text-white',
          )}
        >
          {link.label}
        </a>
      ))}
    </nav>
  )
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#1a1a1a] text-zinc-200">
      <div className="relative mx-auto flex min-h-[5.5rem] max-w-[1400px] items-center justify-between px-6 sm:px-8 md:min-h-0 md:py-10 md:px-10 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:py-12 lg:px-14">
        <div className="hidden min-w-0 lg:block">
          <NavLinks className="justify-self-start" />
        </div>

        <a
          href="#home"
          className="font-brand absolute left-1/2 -translate-x-1/2 text-center text-xl tracking-[0.28em] text-white uppercase lg:static lg:translate-x-0 lg:justify-self-center lg:text-2xl"
        >
          MA NOULA
        </a>

        <div className="flex items-center gap-2 justify-self-end md:gap-4">
          <ThemeToggle className="text-zinc-300 hover:bg-white/10 hover:text-white" />

          <Sheet>
            <SheetTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-zinc-200 hover:bg-white/10 lg:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              }
            />
            <SheetContent
              side="right"
              className="flex w-full flex-col gap-6 border-zinc-800 bg-[#1a1a1a] text-zinc-100 sm:max-w-sm"
            >
              <SheetHeader className="text-left">
                <SheetTitle className="font-brand text-white tracking-[0.2em] uppercase">
                  Menu
                </SheetTitle>
              </SheetHeader>
              <NavLinks variant="mobile" />
              <SearchField idPrefix="sheet" />
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-5 sm:px-8 lg:hidden">
        <SearchField idPrefix="mobile-bar" />
      </div>
    </header>
  )
}
