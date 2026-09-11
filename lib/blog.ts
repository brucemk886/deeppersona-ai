import anxiousAttachment from "@/content/blog/anxious-attachment.md?raw";
import avoidantAttachment from "@/content/blog/avoidant-attachment.md?raw";
import fearfulAvoidant from "@/content/blog/fearful-avoidant-push-pull.md?raw";
import pursueWithdraw from "@/content/blog/anxious-avoidant-pursue-withdraw.md?raw";
import quizLimits from "@/content/blog/what-attachment-quizzes-can-and-cannot-tell-you.md?raw";
import { countMarkdownWords, parseFrontmatter, type BlogPost } from "@/lib/blog-parse";

export { normalizeBlogPost, type BlogPost } from "@/lib/blog-parse";

export const ATTACHMENT_QUIZ_PATH = "/tests/attachment-style";
export const BLOG_CTA_COPY = "Notice your pattern in images, not labels. Take the short visual reflection.";

const rawDocuments = [anxiousAttachment, avoidantAttachment, fearfulAvoidant, pursueWithdraw, quizLimits];

export const defaultBlogPosts: BlogPost[] = rawDocuments
  .map((raw) => {
    const { data, body } = parseFrontmatter(raw);
    return { ...data, active: true, body, wordCount: countMarkdownWords(raw) };
  })
  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.title.localeCompare(right.title));

/** Seed catalog only. Live pages read D1 through `db/blog-store`. */
export const blogPosts = defaultBlogPosts;

export function blogQuizHref(slug: string) {
  return `${ATTACHMENT_QUIZ_PATH}?utm_source=organic_content&utm_medium=blog&utm_campaign=${encodeURIComponent(slug)}`;
}

export function relatedBlogPosts(posts: BlogPost[], slug: string, limit = 2) {
  return posts.filter((post) => post.slug !== slug && post.active).slice(0, limit);
}
