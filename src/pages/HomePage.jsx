const specialties = [
  {
    title: 'Lactation support',
    blurb: 'IBCLCs and counselors for feeding goals and comfort.',
  },
  {
    title: 'Postpartum doula care',
    blurb: 'Hands-on help at home so you can rest and recover.',
  },
  {
    title: 'Mental health & therapy',
    blurb: 'Licensed therapists who focus on the perinatal journey.',
  },
  {
    title: 'Pelvic floor & physical therapy',
    blurb: 'Specialists for recovery, strength, and pain relief.',
  },
  {
    title: 'Sleep & infant care',
    blurb: 'Guidance for safer sleep and more predictable nights.',
  },
  {
    title: 'Nutrition & wellness',
    blurb: 'Dietitians tailored to pregnancy and postpartum needs.',
  },
]

const steps = [
  {
    step: '1',
    title: 'Search or browse',
    text: 'Filter by specialty, availability, and what matters most to you.',
  },
  {
    step: '2',
    title: 'Read profiles & reviews',
    text: 'Compare bios, credentials, and community feedback in one place.',
  },
  {
    step: '3',
    title: 'Message & book',
    text: 'Reach out securely and schedule visits that fit your calendar.',
  },
  {
    step: '4',
    title: 'Stay supported',
    text: 'Manage ongoing care and follow-ups from your dashboard.',
  },
]

const testimonials = [
  {
    quote:
      'I found a lactation consultant who actually listened. Booking took minutes.',
    name: 'Alex M.',
    detail: 'New parent',
  },
  {
    quote:
      'As a provider, Manoula keeps my profile and availability in sync without the admin headache.',
    name: 'Dr. Priya S.',
    detail: 'Perinatal therapist',
  },
  {
    quote:
      'Finally one place to compare real reviews and message before committing.',
    name: 'Jordan L.',
    detail: 'Second-time parent',
  },
]

export function HomePage() {
  return (
    <main id="main-content">
      <section className="hero" aria-labelledby="hero-heading">
        <div className="hero__content">
          <p className="hero__eyebrow">Maternal wellness marketplace</p>
          <h1 id="hero-heading" className="hero__title">
            Care that meets you where you are
          </h1>
          <p className="hero__lede">
            Manoula connects mothers with certified professionals for lactation,
            mental health, postpartum support, and more—so you can choose help
            you trust.
          </p>
          <div className="hero__cta">
            <a className="btn btn--primary btn--lg" href="#search">
              Find support
            </a>
            <a
              className="btn btn--secondary btn--lg"
              href="#join-professional"
            >
              Join as a professional
            </a>
          </div>
          <p className="hero__note">
            All providers are verified. Search by specialty and availability.
          </p>
        </div>
        <div className="hero__panel" aria-hidden="true">
          <div className="hero__card">
            <span className="hero__card-label">Search</span>
            <p className="hero__card-title">Find your next visit</p>
            <div className="hero__fake-search" id="search">
              <span>Try “postpartum doula near me”</span>
            </div>
          </div>
        </div>
      </section>

      <section
        id="specialties"
        className="section section--soft"
        aria-labelledby="specialties-heading"
      >
        <div className="section__header">
          <h2 id="specialties-heading">Featured specialties</h2>
          <p className="section__sub">
            Explore popular categories from our network of certified
            professionals.
          </p>
        </div>
        <ul className="card-grid">
          {specialties.map((item) => (
            <li key={item.title} className="specialty-card">
              <h3 className="specialty-card__title">{item.title}</h3>
              <p className="specialty-card__text">{item.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="how-it-works"
        className="section"
        aria-labelledby="how-heading"
      >
        <div className="section__header">
          <h2 id="how-heading">How it works</h2>
          <p className="section__sub">
            From discovery to ongoing care—simple steps, clear expectations.
          </p>
        </div>
        <ol className="steps">
          {steps.map((item) => (
            <li key={item.step} className="steps__item">
              <span className="steps__badge" aria-hidden="true">
                {item.step}
              </span>
              <div>
                <h3 className="steps__title">{item.title}</h3>
                <p className="steps__text">{item.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        id="stories"
        className="section section--soft"
        aria-labelledby="stories-heading"
      >
        <div className="section__header">
          <h2 id="stories-heading">Stories from our community</h2>
          <p className="section__sub">
            Real experiences from parents and professionals on Manoula.
          </p>
        </div>
        <ul className="testimonial-grid">
          {testimonials.map((t) => (
            <li key={t.name} className="testimonial">
              <blockquote className="testimonial__quote">“{t.quote}”</blockquote>
              <p className="testimonial__name">{t.name}</p>
              <p className="testimonial__detail">{t.detail}</p>
            </li>
          ))}
        </ul>
      </section>

      <section
        id="for-professionals"
        className="section section--cta"
        aria-labelledby="pro-heading"
      >
        <div className="cta-panel">
          <h2 id="pro-heading">Grow your practice with Manoula</h2>
          <p className="cta-panel__text">
            Manage your public profile, services, availability, and bookings in
            one dashboard—built for certified maternal wellness professionals.
          </p>
          <a
            className="btn btn--light btn--lg"
            href="#join-professional"
            id="join-professional"
          >
            Join as a professional
          </a>
        </div>
      </section>
    </main>
  )
}
