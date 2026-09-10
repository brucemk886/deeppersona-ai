import Link from "next/link";
import type { InsightArticleCard } from "@/lib/insights-index";

export function InsightsHeader() {
  return (
    <header className="insights-header">
      <Link className="brand" href="/">
        <span className="brand-mark">DP</span>
        <span>DeepPersona AI</span>
      </Link>
      <nav aria-label="Site navigation">
        <Link href="/#quiz">Quiz</Link>
        <Link href="/insights">Learn</Link>
        <Link href="/blog">Blog</Link>
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
        <Link href="/#quiz">Quiz</Link>
        <Link href="/insights">Learn</Link>
        <Link href="/blog">Blog</Link>
        <Link href="/disclaimer">Disclaimer</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/contact">Contact</Link>
      </nav>
    </footer>
  );
}

export function ContentCard({
  excerpt,
  href,
  readMinutes,
  title,
}: {
  excerpt: string;
  href: string;
  readMinutes: number;
  title: string;
}) {
  return (
    <article className="insight-card">
      <span>{readMinutes} min read</span>
      <h2><Link href={href}>{title}</Link></h2>
      <p>{excerpt}</p>
      <Link className="insight-card-link" href={href}>Read the guide <span aria-hidden="true">→</span></Link>
    </article>
  );
}

export function InsightCard({ article }: { article: InsightArticleCard }) {
  return (
    <ContentCard
      excerpt={article.excerpt}
      href={`/insights/${article.slug}`}
      readMinutes={article.readMinutes}
      title={article.title}
    />
  );
}
