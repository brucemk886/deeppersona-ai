import assert from "node:assert/strict";
import test from "node:test";
import { countBodyWords, normalizeBlogPost } from "../lib/blog-parse.ts";

test("normalizeBlogPost accepts a complete English post and rejects a bad slug", () => {
  const post = normalizeBlogPost({
    slug: "anxious-attachment",
    title: "Anxious attachment",
    excerpt: "How closeness can feel like work.",
    body: "First paragraph.\n\n<!-- CTA -->\n\nClosing note.",
    publishedAt: "2026-09-11",
    updatedAt: "2026-09-11",
    readMinutes: 6,
    primaryTestId: "attachment-style",
    active: true,
  });
  assert.equal(typeof post, "object");
  if (typeof post === "string") throw new Error(post);
  assert.equal(post.slug, "anxious-attachment");
  assert.equal(post.wordCount, countBodyWords(post.body));
  assert.equal(normalizeBlogPost({ ...post, slug: "Bad Slug" }), "URL 使用小写字母、数字和连字符，例如 anxious-attachment。");
});
