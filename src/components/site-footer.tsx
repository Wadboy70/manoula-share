import {
  footerEmail,
  footerLocation,
  footerTagline,
} from '@/data/home-content'

export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      id="contact"
      className="bg-black py-24 text-white md:py-32 lg:py-40"
    >
      <div className="mx-auto grid max-w-6xl gap-16 px-8 sm:px-10 md:grid-cols-3 md:gap-20 md:px-12 lg:px-16">
        <div>
          <p className="font-brand text-2xl tracking-[0.2em] uppercase md:text-3xl">
            MA NOULA
          </p>
          <p className="font-body mt-5 text-base leading-relaxed text-white/80">
            {footerTagline}
          </p>
        </div>
        <div>
          <h3 className="font-brand text-xl font-normal tracking-wide md:text-2xl">
            Location
          </h3>
          <p className="font-body mt-5 text-base leading-relaxed text-white/85">
            {footerLocation}
          </p>
        </div>
        <div>
          <h3 className="font-brand text-xl font-normal tracking-wide md:text-2xl">
            Contact
          </h3>
          <a
            href={`mailto:${footerEmail}`}
            className="font-body mt-5 inline-block text-base text-white underline decoration-white/40 underline-offset-4 transition-colors hover:decoration-white"
          >
            {footerEmail}
          </a>
        </div>
      </div>
      <p className="font-body mt-20 border-t border-white/10 pt-12 text-center text-xs text-white/50 md:mt-28 md:pt-16">
        © {year} Manoula. All rights reserved.
      </p>
    </footer>
  )
}
