export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <span className="site-logo site-logo--footer">Manoula</span>
          <p className="site-footer__tagline">
            Maternal wellness, matched with care.
          </p>
        </div>
        <nav className="site-footer__nav" aria-label="Footer">
          <a href="/help">Help</a>
          <a href="/contact">Contact</a>
          <a href="/terms">Terms</a>
          <a href="/privacy">Privacy</a>
        </nav>
      </div>
      <p className="site-footer__copy">
        © {new Date().getFullYear()} Manoula. All rights reserved.
      </p>
    </footer>
  )
}
