import { useState } from 'react'

export function Header() {
  const [query, setQuery] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className={`site-header${menuOpen ? ' site-header--open' : ''}`}>
      <div className="site-header__inner">
        <a className="site-logo" href="/">
          Manoula
        </a>

        <nav className="site-nav" aria-label="Main">
          <a href="#specialties" onClick={() => setMenuOpen(false)}>
            Specialties
          </a>
          <a href="#how-it-works" onClick={() => setMenuOpen(false)}>
            How it works
          </a>
          <a href="#stories" onClick={() => setMenuOpen(false)}>
            Stories
          </a>
          <a href="#for-professionals" onClick={() => setMenuOpen(false)}>
            For professionals
          </a>
        </nav>

        <form
          className="site-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <label htmlFor="global-search" className="visually-hidden">
            Search providers or services
          </label>
          <input
            id="global-search"
            type="search"
            placeholder="Search providers, topics…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
          <button type="submit">Search</button>
        </form>

        <div className="site-header__actions">
          <a className="btn btn--ghost" href="#sign-in">
            Sign in
          </a>
          <a className="btn btn--primary" href="#join-professional">
            Join as a professional
          </a>
        </div>

        <button
          type="button"
          className="nav-toggle"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
