import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightCard, InsightsFooter, InsightsHeader } from "@/app/insights/_components/insights-chrome";
import { getInsightArticle, insightArticles } from "@/lib/insights";
import { defaultTests } from "@/lib/quiz";
import { getInsightCardsForCluster, getInsightCluster } from "@/lib/insights-index";

const SITE_URL = "https://deeppersonaai.com";

export function generateStaticParams() {
  return insightArticles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getInsightArticle(slug);
  if (!article) return {};
  const test = defaultTests.find((item) => item.id === article.primaryTestId);
  const image = test?.coverAtlasPath.replace(".png", "-768.webp");
  return {
    title: `${article.title} — DeepPersona AI`,
    description: article.excerpt,
    alternates: { canonical: `/insights/${article.slug}` },
    openGraph: {
      type: "article",
      url: `/insights/${article.slug}`,
      title: article.title,
      description: article.excerpt,
      publishedTime: `${article.publishedAt}T09:00:00+08:00`,
      modifiedTime: `${article.updatedAt}T09:00:00+08:00`,
      images: image ? [{ url: image }] : [],
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title: article.title,
      description: article.excerpt,
      images: image ? [image] : [],
    },
  };
}

export default async function InsightArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getInsightArticle(slug);
  if (!article) notFound();
  const cluster = getInsightCluster(article.clusterSlug);
  const test = defaultTests.find((item) => item.id === article.primaryTestId);
  if (!cluster || !test) notFound();
  const related = getInsightCardsForCluster(article.clusterSlug).filter((item) => item.slug !== article.slug).slice(0, 2);
  const fallbackRelated = insightArticles.filter((item) => item.slug !== article.slug && !related.some((relatedItem) => relatedItem.slug === item.slug)).slice(0, 2 - related.length);
  const relatedArticles = [...related, ...fallbackRelated];
  const testHref = `/tests/${test.id}?utm_source=organic_content&utm_medium=insight&utm_campaign=${article.slug}`;
  const articleUrl = `${SITE_URL}/insights/${article.slug}`;
  const testImage = test.coverAtlasPath.replace(".png", "-768.webp");
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: articleUrl,
    author: { "@type": "Organization", name: "DeepPersona AI Editorial Team", url: `${SITE_URL}/insights` },
    publisher: { "@type": "Organization", name: "DeepPersona AI", url: SITE_URL },
    image: `${SITE_URL}${testImage}`,
  };
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: article.faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };

  return (
    <main className="insights-shell">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(faqData).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <InsightsHeader />
      <article className="insight-article">
        <header className="article-hero" style={{ "--cluster-accent": cluster.accent } as React.CSSProperties}>
          <nav aria-label="Breadcrumb"><Link href="/insights">Insights</Link><span>/</span><Link href={`/insights/topics/${cluster.slug}`}>{cluster.label}</Link></nav>
          <span>{cluster.label}</span>
          <h1>{article.title}</h1>
          <p>{article.excerpt}</p>
          <div><span>By DeepPersona AI Editorial Team</span><span>Reviewed {article.updatedAt}</span><span>{article.readMinutes} min read</span></div>
        </header>

        <div className="article-layout">
          <div className="article-body">
            <section className="article-answer" aria-labelledby="short-answer-title">
              <span>Short answer</span><h2 id="short-answer-title">What may be happening</h2><p>{article.directAnswer}</p>
            </section>
            <aside className="article-key-points" aria-label="Key points"><span>In this guide</span><ul>{article.keyPoints.map((point) => <li key={point}>{point}</li>)}</ul></aside>
            {article.sections.map((section, index) => (
              <section className="article-section" key={section.heading}>
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
                {index === 1 ? <aside className="inline-reflection-cta"><span>Notice your first response</span><h3>{test.title}</h3><p>{test.description}</p><Link href={testHref}>Take the 2-minute visual reflection →</Link></aside> : null}
              </section>
            ))}
            <section className="reflection-prompts"><span>Pause before the next label</span><h2>Three questions to take with you</h2><ol>{article.reflectionPrompts.map((prompt) => <li key={prompt}>{prompt}</li>)}</ol></section>
            <section className="article-faq"><span>Common questions</span><h2>What people often ask next</h2>{article.faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</section>
            <section className="article-sources"><span>Sources</span><h2>Research used in this guide</h2><ol>{article.sources.map((source) => <li key={source.url}><a href={source.url} rel="noopener noreferrer" target="_blank">{source.title}</a><small>{source.publication}</small></li>)}</ol></section>
            <p className="article-disclaimer">This guide is for education and self-reflection. It is not a diagnosis, medical advice, or a substitute for care from a qualified professional.</p>
          </div>
          <aside className="article-test-card">
            <div className="article-test-image"><img alt={`Four visual choices from ${test.title}`} decoding="async" loading="lazy" src={testImage} /></div>
            <span>Continue with images</span><h2>{test.title}</h2><p>{test.description}</p><Link href={testHref}>Start the free visual test <span aria-hidden="true">→</span></Link><small>4 choices · about 2 minutes · self-reflection, not diagnosis</small>
          </aside>
        </div>
      </article>
      <section className="related-insights"><div className="insights-section-heading"><span>Keep exploring</span><h2>Related questions</h2></div><div className="insight-card-grid">{relatedArticles.map((item) => <InsightCard article={item} key={item.slug} />)}</div></section>
      <InsightsFooter />
    </main>
  );
}
