import anxiousAttachment from "@/content/blog/anxious-attachment.md?raw";
import avoidantAttachment from "@/content/blog/avoidant-attachment.md?raw";
import fearfulAvoidant from "@/content/blog/fearful-avoidant-push-pull.md?raw";
import pursueWithdraw from "@/content/blog/anxious-avoidant-pursue-withdraw.md?raw";
import quizLimits from "@/content/blog/what-attachment-quizzes-can-and-cannot-tell-you.md?raw";
import { countMarkdownWords, parseFrontmatter, type BlogFrontmatter } from "@/lib/blog-parse";

export const ATTACHMENT_QUIZ_PATH = "/tests/attachment-style";
export const BLOG_CTA_COPY = "Notice your pattern in images, not labels. Take the 2-minute visual reflection.";

export type BlogPost = BlogFrontmatter & {
  body: string;
  wordCount: number;
};

const rawDocuments = [anxiousAttachment, avoidantAttachment, fearfulAvoidant, pursueWithdraw, quizLimits];

export const blogPosts: BlogPost[] = rawDocuments
  .map((raw) => {
    const { data, body } = parseFrontmatter(raw);
    return { ...data, body, wordCount: countMarkdownWords(raw) };
  })
  .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt) || left.title.localeCompare(right.title));

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}

export function getRelatedBlogPosts(slug: string, limit = 2) {
  return blogPosts.filter((post) => post.slug !== slug).slice(0, limit);
}

export function blogQuizHref(slug: string) {
  return `${ATTACHMENT_QUIZ_PATH}?utm_source=organic_content&utm_medium=blog&utm_campaign=${encodeURIComponent(slug)}`;
}
