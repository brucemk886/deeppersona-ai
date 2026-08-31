import Link from "next/link";
import type { InsightArticleCard } from "@/lib/insights-index";

export function InsightsHeader() {
  return (
    <header className="insights-header">
      <Link className="brand" href="/">
        <span className="brand-mark">DP</span>
        <span>DeepPersona AI</span>
      </Link>
      <nav aria-label="Insights navigation">
        <Link href="/insights">Insights</Link>
        <Link href="/#tests">Visual tests</Link>
      </nav>
    </header>
  );
}

export function InsightsFooter() {
  return (
    <footer className="insights-footer">
      <div>
        <strong>DeepPersona AI © 2026</strong>
        <span>Evidence-aware self-reflection. Not clinical diagnosis or treatment.</span>
      </div>
      <nav aria-label="Footer links">
        <Link href="/insights">Insights</Link>
        <Link href="/#tests">Visual tests</Link>
        <Link href="/disclaimer">Disclaimer</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}

export function InsightCard({ article }: { article: InsightArticleCard }) {
  return (
    <article className="insight-card">
      <span>{article.readMinutes} min read</span>
      <h2><Link href={`/insights/${article.slug}`}>{article.title}</Link></h2>
      <p>{article.excerpt}</p>
      <Link className="insight-card-link" href={`/insights/${article.slug}`}>Read the guide <span aria-hidden="true">→</span></Link>
    </article>
  );
}
