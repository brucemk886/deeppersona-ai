import { BrandLogo } from "@/app/_components/brand";
import Link from "next/link";
import { ListIcon } from "@phosphor-icons/react/dist/ssr";

type SiteNavProps = {
  active?: "home" | "quiz" | "insights" | "blog";
  brandHref?: string;
  onBrandClick?: () => void;
};

export function SiteNav({ active = "home", brandHref = "/", onBrandClick }: SiteNavProps) {
  const brand = (
    <>
      <BrandLogo />
    </>
  );

  return (
    <nav className="nav-bar" aria-label="Main navigation">
      {onBrandClick ? (
        <button aria-label="DeepPersona AI home" className="brand brand-button" onClick={onBrandClick} type="button">
          {brand}
        </button>
      ) : (
        <Link prefetch={false} aria-label="DeepPersona AI home" className="brand" href={brandHref}>
          {brand}
        </Link>
      )}
      <div className="main-nav-links">
        <Link prefetch={false} className={`nav-note nav-link${active === "quiz" ? " is-active" : ""}`} href="/#quiz">
          Quiz
        </Link>
        <Link prefetch={false} className={`nav-note nav-link${active === "insights" ? " is-active" : ""}`} href="/insights">
          Learn
        </Link>
        <Link prefetch={false} className={`nav-note nav-link${active === "blog" ? " is-active" : ""}`} href="/blog">
          Blog
        </Link>
      </div>
      <details className="mobile-site-menu">
        <summary aria-label="Open navigation"><ListIcon size={28} weight="regular" /></summary>
        <div>
          <Link prefetch={false} href="/#quiz">Take the quiz</Link>
          <Link prefetch={false} href="/insights">Learn</Link>
          <Link prefetch={false} href="/blog">Blog</Link>
          <Link prefetch={false} href="/recover">My reports</Link>
          <Link prefetch={false} href="/contact">About & contact</Link>
        </div>
      </details>
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
        <Link prefetch={false} href="/#quiz">Quiz</Link>
        <Link prefetch={false} href="/insights">Learn</Link>
        <Link prefetch={false} href="/blog">Blog</Link>
        <Link prefetch={false} href="/recover">My reports</Link>
        <Link prefetch={false} href="/privacy">Privacy</Link>
        <Link prefetch={false} href="/terms">Terms</Link>
        <Link prefetch={false} href="/refunds">Refunds & delivery</Link>
        <Link prefetch={false} href="/disclaimer">Disclaimer</Link>
        <Link prefetch={false} href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}
