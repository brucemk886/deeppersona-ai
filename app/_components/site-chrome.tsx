import Link from "next/link";

type SiteNavProps = {
  active?: "home" | "quiz" | "insights" | "blog";
  brandHref?: string;
  onBrandClick?: () => void;
};

export function SiteNav({ active = "home", brandHref = "/", onBrandClick }: SiteNavProps) {
  const brand = (
    <>
      <span className="brand-mark">DP</span>
      <span>DeepPersona AI</span>
    </>
  );

  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {onBrandClick ? (
        <button aria-label="DeepPersona AI home" className="brand brand-button" onClick={onBrandClick} type="button">
          {brand}
        </button>
      ) : (
        <Link aria-label="DeepPersona AI home" className="brand" href={brandHref}>
          {brand}
        </Link>
      )}
      <div className="main-nav-links">
        <Link className={`nav-note nav-link${active === "quiz" ? " is-active" : ""}`} href="/#quiz">
          Quiz
        </Link>
        <Link className={`nav-note nav-link${active === "insights" ? " is-active" : ""}`} href="/insights">
          Learn
        </Link>
        <Link className={`nav-note nav-link${active === "blog" ? " is-active" : ""}`} href="/blog">
          Blog
        </Link>
      </div>
    </nav>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer site-footer-expanded">
      <div>
        <strong>DeepPersona AI © 2026</strong>
        <span>Educational self-reflection. Not a clinical diagnosis.</span>
      </div>
      <nav aria-label="Legal and support links">
        <Link href="/#quiz">Quiz</Link>
        <Link href="/insights">Learn</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/recover">My reports</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refunds">Refunds & delivery</Link>
        <Link href="/disclaimer">Disclaimer</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}
