import { Link } from 'react-router-dom'

import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import {
  aboutHeading,
  aboutParagraphs,
  heroTagline,
  steps,
} from '@/features/home/home-content'
import { cn } from '@/lib/utils'

const heroImageUrl =
  'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?auto=format&fit=crop&w=1920&q=80'

const aboutImageUrl =
  'https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80'

export function HomePage() {
  return (
    <main id="main-content" className="flex-1">
      {/* Hero — full-bleed image + overlay + serif title */}
      <section
        id="home"
        className="relative flex min-h-[78vh] w-full items-center justify-center"
        aria-labelledby="hero-brand"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImageUrl})` }}
        />
        <div
          className="absolute inset-0 z-[1] bg-black/80"
          aria-hidden
        />
        <div className="relative z-10 max-w-5xl px-6 text-center">
          <p
            id="hero-brand"
            className="font-brand text-5xl font-medium tracking-[0.22em] text-white uppercase drop-shadow-sm md:text-7xl md:tracking-[0.28em]"
          >
            MA NOULA
          </p>
          <p className="font-body mt-8 max-w-2xl text-lg leading-relaxed tracking-wide text-white/95 md:text-xl">
            {heroTagline}
          </p>
          <div
            id="book"
            className="mt-12 flex w-full max-w-2xl flex-col items-stretch justify-center gap-4 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Link
              to="/find-support"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'font-body min-h-14 w-full rounded-none px-10 text-base font-semibold text-black sm:w-auto md:min-h-16 md:px-14 md:text-lg',
                'bg-[#e5e5e5] hover:bg-white',
              )}
            >
              Find support
            </Link>
            <Link
              to="/join"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'font-body min-h-14 w-full rounded-none border-2 border-white/90 px-10 text-base font-semibold text-white sm:w-auto md:min-h-16 md:px-14 md:text-lg',
                'bg-transparent hover:bg-white/10',
              )}
            >
              Join as a professional
            </Link>
          </div>
        </div>
      </section>

      {/* About — split: image + bone panel */}
      <section
        id="about"
        className="grid min-h-[min(520px,90vh)] md:grid-cols-2"
        aria-labelledby="about-heading"
      >
        <div className="relative min-h-[280px] md:min-h-full">
          <img
            src={aboutImageUrl}
            alt=""
            className="absolute inset-0 size-full object-cover grayscale"
          />
        </div>
        <div className="flex flex-col justify-center bg-[#f5f5f5] px-8 py-20 md:px-16 md:py-28 lg:px-24">
          <h2
            id="about-heading"
            className="font-brand text-4xl font-medium tracking-tight text-black md:text-5xl"
          >
            {aboutHeading}
          </h2>
          <div className="font-body mt-10 space-y-6 text-lg leading-[1.7] text-black/90">
            {aboutParagraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <Link
            to="/find-support"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'font-brand mt-10 w-fit rounded-none bg-black px-10 text-white hover:bg-black/90',
            )}
          >
            Get started
          </Link>
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="bg-zinc-900 py-16 md:py-24"
        aria-labelledby="how-heading"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="how-heading"
              className="font-brand text-3xl font-medium tracking-tight md:text-4xl"
            >
              How it works
            </h2>
            <p className="font-body mt-4 text-lg text-muted-foreground">
              We collect your information, then reach out to connect you with the right people.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-3">
            {steps.map((item) => (
              <li key={item.step}>
                <Card className="h-full border-white/10 bg-zinc-950 shadow-sm">
                  <CardContent className="flex gap-4 pt-6">
                    <span
                      className="font-brand bg-white/10 text-foreground flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                      aria-hidden
                    >
                      {item.step}
                    </span>
                    <div className="min-w-0 text-left">
                      <h3 className="font-brand text-lg font-medium">
                        {item.title}
                      </h3>
                      <p className="font-body mt-1 text-sm leading-relaxed text-muted-foreground">
                        {item.text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  )
}
