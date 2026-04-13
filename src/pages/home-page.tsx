import { buttonVariants } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import {
  aboutHeading,
  aboutParagraphs,
  heroTagline,
  specialties,
  steps,
  testimonials,
} from '@/data/home-content'
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
          className="absolute inset-0 bg-black/45"
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
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#specialties"
              className={cn(
                buttonVariants({ size: 'lg' }),
                'rounded-none bg-[#e5e5e5] px-8 text-black hover:bg-white',
              )}
            >
              Find support
            </a>
            <a
              href="/signup/professional"
              className={cn(
                buttonVariants({ variant: 'outline', size: 'lg' }),
                'rounded-none border-white/80 bg-transparent text-white hover:bg-white/10',
              )}
            >
              Join as a professional
            </a>
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
          <a
            href="#specialties"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'font-brand mt-10 w-fit rounded-none bg-black px-10 text-white hover:bg-black/90',
            )}
          >
            Learn more
          </a>
        </div>
      </section>

      {/* Services / specialties */}
      <section
        id="specialties"
        className="border-y border-white/10 bg-zinc-950 py-16 md:py-24"
        aria-labelledby="specialties-heading"
      >
        <div className="mx-auto max-w-6xl px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2
              id="specialties-heading"
              className="font-brand text-3xl font-medium tracking-tight text-white md:text-4xl"
            >
              Our services
            </h2>
            <p className="font-body mt-4 text-lg text-zinc-300">
              Explore categories from our network of certified professionals.
            </p>
          </div>
          <ul className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {specialties.map((item) => (
              <li key={item.title}>
                <Card className="h-full border-white/10 shadow-none transition-shadow hover:shadow-md">
                  <CardHeader>
                    <CardTitle className="font-brand text-lg font-medium">
                      {item.title}
                    </CardTitle>
                    <CardDescription className="font-body text-base leading-relaxed">
                      {item.blurb}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ul>
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
              From discovery to ongoing care—simple steps, clear expectations.
            </p>
          </div>
          <ol className="mt-12 grid gap-4 md:grid-cols-2">
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

      {/* Testimonials — dark carousel */}
      <section
        id="stories"
        className="bg-black py-20 text-white md:py-28"
        aria-labelledby="stories-heading"
      >
        <div className="mx-auto max-w-4xl px-4 sm:px-12 md:px-16">
          <h2
            id="stories-heading"
            className="font-brand text-center text-2xl font-medium tracking-wide md:text-3xl"
          >
            Stories
          </h2>
          <Carousel
            opts={{ loop: true, align: 'center' }}
            className="relative mt-12"
          >
            <CarouselPrevious
              className="-left-2 border-0 bg-zinc-300 text-black hover:bg-zinc-200 md:-left-4"
              variant="outline"
            />
            <CarouselContent className="ml-0">
              {testimonials.map((t) => (
                <CarouselItem key={t.name}>
                  <blockquote className="font-body mx-auto max-w-2xl px-4 text-center text-lg leading-relaxed md:text-xl">
                    {t.quote}
                  </blockquote>
                  <p className="font-body mt-8 text-center text-sm italic text-zinc-400">
                    {t.name}
                    {t.detail ? ` · ${t.detail}` : ''}
                  </p>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselNext
              className="-right-2 border-0 bg-zinc-300 text-black hover:bg-zinc-200 md:-right-4"
              variant="outline"
            />
          </Carousel>
        </div>
      </section>

      {/* Pro CTA */}
      <section
        id="for-professionals"
        className="mx-auto max-w-6xl px-4 py-16 md:py-20"
        aria-labelledby="pro-heading"
      >
        <div className="relative overflow-hidden border border-white/10 bg-zinc-900 px-6 py-12 text-center md:px-12">
          <h2
            id="pro-heading"
            className="font-brand text-2xl font-medium md:text-3xl"
          >
            Grow your practice with Manoula
          </h2>
          <p className="font-body mx-auto mt-4 max-w-xl text-pretty text-lg text-zinc-300">
            Manage your public profile, services, availability, and bookings in
            one dashboard—built for certified maternal wellness professionals.
          </p>
          <a
            id="join-professional"
            href="/signup/professional"
            className={cn(
              buttonVariants({ size: 'lg' }),
              'font-brand mt-8 rounded-none bg-black px-8 text-white hover:bg-black/90',
            )}
          >
            Join as a professional
          </a>
        </div>
      </section>
    </main>
  )
}
