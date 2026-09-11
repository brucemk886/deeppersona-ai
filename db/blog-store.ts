import { defaultBlogPosts, type BlogPost } from "@/lib/blog";
import { countBodyWords } from "@/lib/blog-parse";
import { ensureQuizSchema, getD1 } from "@/db/quiz-store";

type BlogRow = {
  active: number;
  body: string;
  excerpt: string;
  published_at: string;
  primary_test_id: string;
  read_minutes: number;
  slug: string;
  title: string;
  updated_at: string;
};

let catalogReady: Promise<void> | undefined;

function rowToPost(row: BlogRow): BlogPost {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    publishedAt: row.published_at,
    updatedAt: row.updated_at,
    readMinutes: Number(row.read_minutes),
    primaryTestId: row.primary_test_id,
    active: Boolean(row.active),
    wordCount: countBodyWords(row.body),
  };
}

async function initializeBlogCatalog(): Promise<void> {
  await ensureQuizSchema();
  const db = getD1();
  await db.batch([
    db.prepare(`INSERT OR IGNORE INTO blog_catalog_state (id, seed_defaults)
      SELECT 1, NOT EXISTS (SELECT 1 FROM blog_posts)`),
    ...defaultBlogPosts.map((post) =>
      db.prepare(`INSERT OR IGNORE INTO blog_posts
        (slug, title, excerpt, body, published_at, updated_at, read_minutes, primary_test_id, active)
        SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?
        WHERE (SELECT seed_defaults FROM blog_catalog_state WHERE id = 1) = 1`)
        .bind(post.slug, post.title, post.excerpt, post.body, post.publishedAt, post.updatedAt, post.readMinutes, post.primaryTestId, post.active ? 1 : 0),
    ),
    db.prepare("UPDATE blog_catalog_state SET seed_defaults = 0 WHERE id = 1"),
  ]);
}

async function ensureBlogCatalog(): Promise<void> {
  catalogReady ??= initializeBlogCatalog().catch((error) => {
    catalogReady = undefined;
    throw error;
  });
  await catalogReady;
}

export async function listBlogPosts(includeInactive = false): Promise<BlogPost[]> {
  await ensureBlogCatalog();
  const where = includeInactive ? "" : "WHERE active = 1";
  const result = await getD1().prepare(
    `SELECT * FROM blog_posts ${where} ORDER BY published_at DESC, title`,
  ).all<BlogRow>();
  return result.results.map(rowToPost);
}

export async function getBlogPost(slug: string, includeInactive = false): Promise<BlogPost | null> {
  await ensureBlogCatalog();
  const row = await getD1().prepare("SELECT * FROM blog_posts WHERE slug = ?").bind(slug).first<BlogRow>();
  if (!row || (!includeInactive && !row.active)) return null;
  return rowToPost(row);
}

export async function saveBlogPost(post: BlogPost, previousSlug = post.slug): Promise<void> {
  await ensureBlogCatalog();
  const db = getD1();
  if (previousSlug !== post.slug) {
    const taken = await db.prepare("SELECT slug FROM blog_posts WHERE slug = ?").bind(post.slug).first<{ slug: string }>();
    if (taken) throw new Error("这个 URL 已被另一篇文章使用。");
  }
  const existing = await db.prepare("SELECT slug FROM blog_posts WHERE slug = ?").bind(previousSlug).first<{ slug: string }>();
  if (existing) {
    await db.prepare(`UPDATE blog_posts SET
        slug = ?, title = ?, excerpt = ?, body = ?, published_at = ?, updated_at = ?,
        read_minutes = ?, primary_test_id = ?, active = ?
      WHERE slug = ?`)
      .bind(post.slug, post.title, post.excerpt, post.body, post.publishedAt, post.updatedAt, post.readMinutes, post.primaryTestId, post.active ? 1 : 0, previousSlug)
      .run();
    return;
  }
  await db.prepare(`INSERT INTO blog_posts
      (slug, title, excerpt, body, published_at, updated_at, read_minutes, primary_test_id, active)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(post.slug, post.title, post.excerpt, post.body, post.publishedAt, post.updatedAt, post.readMinutes, post.primaryTestId, post.active ? 1 : 0)
    .run();
}

export async function deleteBlogPost(slug: string): Promise<void> {
  await ensureBlogCatalog();
  await getD1().prepare("DELETE FROM blog_posts WHERE slug = ?").bind(slug).run();
}
