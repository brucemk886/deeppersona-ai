import type { Metadata } from "next";
import Link from "next/link";
import { InsightCard, InsightsFooter, InsightsHeader } from "@/app/insights/_components/insights-chrome";
import { insightArticleCards, insightClusters, getInsightCardsForCluster } from "@/lib/insights-index";

export const metadata: Metadata = {
  title: "Psychology & Self-Reflection Insights — DeepPersona AI",
  description:
    "Evidence-aware guides on relationships, emotional needs, social energy, stress, boundaries, and personal strengths—paired with short visual reflections.",
  alternates: { canonical: "/insights" },
  openGraph: {
    title: "Psychology & Self-Reflection Insights — DeepPersona AI",
    description: "Clear, useful reflection before the label. Read a guide, then notice your pattern through images.",
    url: "/insights",
    type: "website",
    images: [{ url: "/og-deep-persona.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Psychology & Self-Reflection Insights — DeepPersona AI",
    description: "Evidence-aware guides paired with short visual reflections.",
    images: ["/og-deep-persona.png"],
  },
};

export default function InsightsPage() {
  return (
    <main className="insights-shell">
      <InsightsHeader />
      <section className="insights-hero">
        <span>Psychology, made useful</span>
        <h1>Understand the pattern before you name it.</h1>
        <p>
          Clear, evidence-aware guides for the moments that are hard to explain—why closeness can feel intense,
          what you need from a relationship, what drains your social energy, and which strengths you may overlook.
        </p>
        <a href="#latest">Explore the latest guides <span aria-hidden="true">↓</span></a>
      </section>

      <section className="insights-clusters" aria-labelledby="topics-title">
        <div className="insights-section-heading">
          <span>Three places to begin</span>
          <h2 id="topics-title">Follow the question that already feels alive.</h2>
        </div>
        <div className="insight-cluster-grid">
          {insightClusters.map((cluster, index) => (
            <Link
              className="insight-cluster-card"
              href={`/insights/topics/${cluster.slug}`}
              key={cluster.slug}
              style={{ "--cluster-accent": cluster.accent } as React.CSSProperties}
            >
              <span>0{index + 1} · {cluster.label}</span>
              <h3>{cluster.title}</h3>
              <p>{cluster.description}</p>
              <strong>{getInsightCardsForCluster(cluster.slug).length} published guide{getInsightCardsForCluster(cluster.slug).length === 1 ? "" : "s"} →</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="insights-latest" id="latest" aria-labelledby="latest-title">
        <div className="insights-section-heading">
          <span>Latest reflections</span>
          <h2 id="latest-title">Start with a question from real life.</h2>
          <p>Each guide gives you a complete answer first, then offers a related two-minute visual reflection.</p>
        </div>
        <div className="insight-card-grid">
          {insightArticleCards.map((article) => <InsightCard article={article} key={article.slug} />)}
        </div>
      </section>

      <section className="insights-method">
        <div><span>Our approach</span><h2>Reflection without pretending to diagnose you.</h2></div>
        <p>
          We use psychological research to frame possibilities, not to turn one feeling or image choice into a clinical
          conclusion. Every guide separates evidence from interpretation and links its sources.
        </p>
        <Link href="/disclaimer">Read our self-reflection limits →</Link>
      </section>
      <InsightsFooter />
    </main>
  );
}
