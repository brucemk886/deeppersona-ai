import type { Metadata } from "next";
import Link from "next/link";
import { ContentCard, InsightsFooter, InsightsHeader } from "@/app/insights/_components/insights-chrome";
import { listBlogPosts } from "@/db/blog-store";
import { ATTACHMENT_QUIZ_PATH } from "@/lib/blog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Attachment Blog — DeepPersona AI",
  description:
    "Original English guides on anxious attachment, avoidant attachment, fearful-avoidant push-pull, the pursue-withdraw trap, and what quizzes can and cannot tell you.",
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Attachment Blog — DeepPersona AI",
    description: "Clear, original writing on attachment patterns—then a short visual reflection.",
    url: "/blog",
    type: "website",
    images: [{ url: "/og-deep-persona.png" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Attachment Blog — DeepPersona AI",
    description: "Original guides on attachment patterns, paired with a short attachment quiz.",
    images: ["/og-deep-persona.png"],
  },
};

export default async function BlogIndexPage() {
  const posts = await listBlogPosts();
  return (
    <main className="insights-shell">
      <InsightsHeader />
      <section className="insights-hero blog-hero">
        <span>Attachment, in plain English</span>
        <h1>Read the pattern. Then notice it in images.</h1>
        <p>
          Original DeepPersona essays on anxious attachment, avoidant distance, fearful-avoidant
          push-pull, the pursue-withdraw trap, and the honest limits of quizzes. Each piece answers the
          question first, then offers a short visual reflection.
        </p>
        <div className="blog-hero-actions">
          <a href="#posts">Browse the posts <span aria-hidden="true">↓</span></a>
          <Link href={ATTACHMENT_QUIZ_PATH}>Take the attachment quiz →</Link>
        </div>
      </section>

      <section className="insights-latest" id="posts" aria-labelledby="blog-list-title">
        <div className="insights-section-heading">
          <span>Published essays</span>
          <h2 id="blog-list-title">Start with the question that already feels close.</h2>
          <p>Explore everyday relationship patterns, practical reflections, and the limits of what a quiz can tell you.</p>
        </div>
        <div className="insight-card-grid blog-card-grid">
          {posts.map((post) => (
            <ContentCard
              excerpt={post.excerpt}
              href={`/blog/${post.slug}`}
              key={post.slug}
              readMinutes={post.readMinutes}
              title={post.title}
            />
          ))}
        </div>
      </section>
      <InsightsFooter />
    </main>
  );
}
