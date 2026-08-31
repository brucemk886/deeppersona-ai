import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InsightCard, InsightsFooter, InsightsHeader } from "@/app/insights/_components/insights-chrome";
import { defaultTests } from "@/lib/quiz";
import { getInsightCardsForCluster, getInsightCluster, insightClusters } from "@/lib/insights-index";

export function generateStaticParams() {
  return insightClusters.map((cluster) => ({ slug: cluster.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const cluster = getInsightCluster(slug);
  if (!cluster) return {};
  return {
    title: `${cluster.label} Insights — DeepPersona AI`,
    description: cluster.description,
    alternates: { canonical: `/insights/topics/${cluster.slug}` },
    openGraph: {
      title: `${cluster.label} Insights — DeepPersona AI`,
      description: cluster.description,
      url: `/insights/topics/${cluster.slug}`,
      type: "website",
      images: [{ url: "/og-deep-persona.png" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${cluster.label} Insights — DeepPersona AI`,
      description: cluster.description,
      images: ["/og-deep-persona.png"],
    },
  };
}

export default async function InsightTopicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cluster = getInsightCluster(slug);
  if (!cluster) notFound();
  const articles = getInsightCardsForCluster(cluster.slug);
  const tests = defaultTests.filter((test) => cluster.testIds.includes(test.id));

  return (
    <main className="insights-shell">
      <InsightsHeader />
      <section className="topic-hero" style={{ "--cluster-accent": cluster.accent } as React.CSSProperties}>
        <nav aria-label="Breadcrumb"><Link href="/insights">Insights</Link><span>/</span><span>{cluster.label}</span></nav>
        <span>{cluster.label}</span>
        <h1>{cluster.title}</h1>
        <p>{cluster.description}</p>
      </section>
      <section className="topic-content">
        <div className="insights-section-heading"><span>Published guides</span><h2>Questions you can explore now.</h2></div>
        <div className="insight-card-grid">
          {articles.map((article) => <InsightCard article={article} key={article.slug} />)}
        </div>
      </section>
      <section className="topic-tests">
        <div className="insights-section-heading"><span>Go beyond words</span><h2>Notice your first response through images.</h2><p>These short tests offer reflective prompts, not clinical conclusions.</p></div>
        <div>
          {tests.map((test) => (
            <Link href={`/tests/${test.id}?utm_source=insights&utm_medium=topic&utm_campaign=${cluster.slug}`} key={test.id}>
              <span>{test.kicker}</span><h3>{test.title}</h3><p>{test.description}</p><strong>Explore the visual test →</strong>
            </Link>
          ))}
        </div>
      </section>
      <InsightsFooter />
    </main>
  );
}
