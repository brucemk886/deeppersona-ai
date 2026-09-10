import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentCard, InsightsFooter, InsightsHeader } from "@/app/insights/_components/insights-chrome";
import { blogQuizHref, blogPosts, BLOG_CTA_COPY, getBlogPost, getRelatedBlogPosts } from "@/lib/blog";
import { renderMarkdown } from "@/lib/markdown";
import { defaultTests } from "@/lib/quiz-content";

const SITE_URL = "https://deeppersonaai.com";

export function generateStaticParams() {
  return blogPosts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} — DeepPersona AI`,
    description: post.excerpt,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      type: "article",
      url: `/blog/${post.slug}`,
      title: post.title,
      description: post.excerpt,
      publishedTime: `${post.publishedAt}T09:00:00-04:00`,
      modifiedTime: `${post.updatedAt}T09:00:00-04:00`,
      images: [{ url: "/quiz/doors-768.webp" }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: ["/quiz/doors-768.webp"],
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  const test = defaultTests.find((item) => item.id === post.primaryTestId);
  if (!test) notFound();
  const related = getRelatedBlogPosts(post.slug);
  const quizHref = blogQuizHref(post.slug);
  const testImage = test.coverAtlasPath.replace(".png", "-768.webp");
  const articleUrl = `${SITE_URL}/blog/${post.slug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt,
    mainEntityOfPage: articleUrl,
    author: { "@type": "Organization", name: "DeepPersona AI Editorial Team", url: `${SITE_URL}/blog` },
    publisher: { "@type": "Organization", name: "DeepPersona AI", url: SITE_URL },
    image: `${SITE_URL}${testImage}`,
  };
  const inlineCta = (
    <aside className="inline-reflection-cta">
      <span>Notice your first response</span>
      <h3>{test.title}</h3>
      <p>{BLOG_CTA_COPY}</p>
      <Link href={quizHref}>Take the short visual reflection →</Link>
    </aside>
  );

  return (
    <main className="insights-shell">
      <script dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} type="application/ld+json" />
      <InsightsHeader />
      <article className="insight-article">
        <header className="article-hero" style={{ "--cluster-accent": test.accent } as React.CSSProperties}>
          <nav aria-label="Breadcrumb">
            <Link href="/blog">Blog</Link>
            <span>/</span>
            <span>Attachment</span>
          </nav>
          <span>Attachment blog</span>
          <h1>{post.title}</h1>
          <p>{post.excerpt}</p>
          <div>
            <span>By DeepPersona AI Editorial Team</span>
            <span>Updated {post.updatedAt}</span>
            <span>{post.readMinutes} min read</span>
          </div>
        </header>

        <div className="article-layout">
          <div className="article-body article-section blog-article-body">
            {renderMarkdown(post.body, inlineCta)}
            <p className="article-disclaimer">
              This post is for education and self-reflection. It is not a diagnosis, medical advice, or a
              substitute for care from a qualified professional.
            </p>
          </div>
          <aside className="article-test-card">
            <div className="article-test-image">
              <img alt={`Visual choices from ${test.title}`} decoding="async" loading="lazy" src={testImage} />
            </div>
            <span>Continue with images</span>
            <h2>{test.title}</h2>
            <p>{BLOG_CTA_COPY}</p>
            <Link href={quizHref}>Start the free visual quiz <span aria-hidden="true">→</span></Link>
            <small>Image-based self-reflection · not a diagnosis</small>
          </aside>
        </div>
      </article>
      <section className="related-insights">
        <div className="insights-section-heading">
          <span>Keep reading</span>
          <h2>Related posts</h2>
        </div>
        <div className="insight-card-grid">
          {related.map((item) => (
            <ContentCard
              excerpt={item.excerpt}
              href={`/blog/${item.slug}`}
              key={item.slug}
              readMinutes={item.readMinutes}
              title={item.title}
            />
          ))}
        </div>
      </section>
      <InsightsFooter />
    </main>
  );
}
