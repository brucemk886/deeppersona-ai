import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import test from "node:test";
import { countMarkdownWords, parseFrontmatter } from "../lib/blog-parse.ts";

const requiredSlugs = [
  "anxious-attachment",
  "avoidant-attachment",
  "fearful-avoidant-push-pull",
  "anxious-avoidant-pursue-withdraw",
  "what-attachment-quizzes-can-and-cannot-tell-you",
];

test("publishes five original attachment blog posts in the 800-1200 word range", async () => {
  const directory = new URL("../content/blog/", import.meta.url);
  const files = (await readdir(directory)).filter((name) => name.endsWith(".md")).sort();
  assert.deepEqual(
    files,
    requiredSlugs.map((slug) => `${slug}.md`),
  );

  for (const file of files) {
    const raw = await readFile(new URL(file, directory), "utf8");
    const { data, body } = parseFrontmatter(raw);
    const words = countMarkdownWords(raw);
    assert.equal(data.slug, file.replace(/\.md$/, ""));
    assert.equal(data.primaryTestId, "attachment-style");
    assert.match(data.title, /\S/);
    assert.match(data.excerpt, /\S/);
    assert.match(body, /<!-- CTA -->/);
    assert.ok(words >= 800, `${file} is only ${words} words`);
    assert.ok(words <= 1200, `${file} is ${words} words`);
    assert.doesNotMatch(raw, /Attachment Project|attachmentproject|theattachmentproject/i);
  }
});

test("blog routes, nav links, and quiz CTAs are wired through the app", async () => {
  const [blogIndex, blogPost, quiz, chrome, legal, sitemap, analytics] = await Promise.all([
    readFile(new URL("../app/blog/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/blog/[slug]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/quiz-app.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/insights/_components/insights-chrome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/_components/legal-page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/sitemap.xml/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../lib/google-analytics.ts", import.meta.url), "utf8"),
  ]);

  assert.match(blogIndex, /canonical: "\/blog"/);
  assert.match(blogIndex, /href=\{ATTACHMENT_QUIZ_PATH\}/);
  assert.match(blogPost, /canonical: `\/blog\/\$\{post\.slug\}`/);
  assert.match(blogPost, /blogQuizHref/);
  assert.match(blogPost, /BLOG_CTA_COPY/);
  assert.match(quiz, /href="\/blog"/);
  assert.match(chrome, /href="\/blog"/);
  assert.match(legal, /href="\/blog"/);
  assert.match(sitemap, /path: "\/blog"/);
  assert.match(sitemap, /blogPosts/);
  assert.match(analytics, /pathname === '\/blog' \|\| pathname.startsWith\('\/blog\/'\)/);
});
