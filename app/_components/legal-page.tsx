import Link from "next/link";
import type { ReactNode } from "react";

export const SUPPORT_EMAIL = "bruce@loversdaily.com";
export const POLICY_DATE = "July 21, 2026";

const legalLinks = [
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refunds", label: "Refunds & delivery" },
  { href: "/disclaimer", label: "Disclaimer" },
  { href: "/contact", label: "Contact" },
];

export function LegalLinks({ includeAdmin = false }: { includeAdmin?: boolean }) {
  return (
    <nav aria-label="Legal and support links" className="legal-links">
      {legalLinks.map((item) => <Link href={item.href} key={item.href}>{item.label}</Link>)}
      {includeAdmin ? <Link href="/admin">Admin</Link> : null}
    </nav>
  );
}

export function LegalPage({
  children,
  eyebrow,
  intro,
  title,
}: {
  children: ReactNode;
  eyebrow: string;
  intro: string;
  title: string;
}) {
  return (
    <main className="legal-shell">
      <header className="legal-nav">
        <Link aria-label="DeepPersona AI home" className="brand" href="/"><span className="brand-mark">DP</span><span>DeepPersona AI</span></Link>
        <Link className="nav-link" href="/">Back to tests →</Link>
      </header>
      <article className="legal-document">
        <header className="legal-hero">
          <span>{eyebrow}</span>
          <h1>{title}</h1>
          <p>{intro}</p>
          <small>Last updated: {POLICY_DATE}</small>
        </header>
        <div className="legal-content">{children}</div>
      </article>
      <footer className="legal-footer">
        <div><strong>DeepPersona AI</strong><span>Visual self-reflection, not clinical diagnosis.</span></div>
        <LegalLinks />
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
      </footer>
    </main>
  );
}

export function PolicySection({ children, title }: { children: ReactNode; title: string }) {
  return <section className="policy-section"><h2>{title}</h2>{children}</section>;
}
