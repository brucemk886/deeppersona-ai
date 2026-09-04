import { insightArticleCards, insightClusters } from "@/lib/insights-index";
import { defaultTests } from "@/lib/quiz";

const SITE_URL = "https://deeppersonaai.com";

type SitemapEntry = {
  path: string;
  changeFrequency: "weekly" | "monthly" | "yearly";
  priority: number;
  lastModified?: string;
};

function renderEntry(entry: SitemapEntry) {
  const lastModified = entry.lastModified ? `<lastmod>${entry.lastModified}</lastmod>` : "";
  return `<url><loc>${SITE_URL}${entry.path}</loc>${lastModified}<changefreq>${entry.changeFrequency}</changefreq><priority>${entry.priority.toFixed(1)}</priority></url>`;
}

export async function GET() {
  const entries: SitemapEntry[] = [
    { path: "", changeFrequency: "weekly", priority: 1 },
    { path: "/insights", changeFrequency: "weekly", priority: 0.9 },
    { path: "/contact", changeFrequency: "monthly", priority: 0.3 },
    { path: "/privacy", changeFrequency: "yearly", priority: 0.2 },
    { path: "/terms", changeFrequency: "yearly", priority: 0.2 },
    { path: "/refunds", changeFrequency: "yearly", priority: 0.2 },
    { path: "/disclaimer", changeFrequency: "yearly", priority: 0.2 },
    ...defaultTests.filter((test) => test.active).map((test) => ({
      path: `/tests/${test.id}`,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
    ...insightClusters.map((cluster) => ({
      path: `/insights/topics/${cluster.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
    ...insightArticleCards.map((article) => ({
      path: `/insights/${article.slug}`,
      lastModified: article.updatedAt,
      changeFrequency: "monthly" as const,
      priority: 0.8,
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${entries.map(renderEntry).join("")}</urlset>`;
  return new Response(xml, {
    headers: {
      "Cache-Control": "public, max-age=3600",
      "Content-Type": "application/xml; charset=utf-8",
    },
  });
}
