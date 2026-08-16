import Link from "next/link";

export function SiteNav({
  noteHref = "/#tests",
  noteLabel = "Explore 8 visual tests ↓",
}: {
  noteHref?: string;
  noteLabel?: string;
}) {
  return (
    <nav className="nav-bar" aria-label="Main navigation">
      <Link className="brand" href="/">
        <span className="brand-mark">DP</span>
        <span>DeepPersona AI</span>
      </Link>
      <Link className="nav-note nav-link" href={noteHref}>
        {noteLabel}
      </Link>
    </nav>
  );
}

export function SiteFooter({ expanded = false }: { expanded?: boolean }) {
  return (
    <footer className={`site-footer${expanded ? " site-footer-expanded" : ""}`}>
      <div>
        <strong>DeepPersona AI © 2026</strong>
        {expanded ? <span>For self-reflection, not clinical diagnosis.</span> : null}
      </div>
      <nav aria-label={expanded ? "Legal and support links" : "Legal links"}>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refunds">Refunds & delivery</Link>
        {expanded ? <Link href="/disclaimer">Disclaimer</Link> : null}
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}
