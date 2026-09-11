export type BlogFrontmatter = {
  title: string;
  slug: string;
  excerpt: string;
  publishedAt: string;
  updatedAt: string;
  readMinutes: number;
  primaryTestId: string;
};

const REQUIRED_FIELDS = ["title", "slug", "excerpt", "publishedAt", "updatedAt", "readMinutes", "primaryTestId"] as const;

export function parseFrontmatter(raw: string): { data: BlogFrontmatter; body: string } {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("Markdown document is missing YAML frontmatter.");

  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    fields[key] = value;
  }

  for (const key of REQUIRED_FIELDS) {
    if (!fields[key]) throw new Error(`Markdown frontmatter is missing ${key}.`);
  }

  return {
    data: {
      title: fields.title,
      slug: fields.slug,
      excerpt: fields.excerpt,
      publishedAt: fields.publishedAt,
      updatedAt: fields.updatedAt,
      readMinutes: Number(fields.readMinutes),
      primaryTestId: fields.primaryTestId,
    },
    body: match[2].trim(),
  };
}

export function countBodyWords(body: string): number {
  const text = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_>`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}

export function countMarkdownWords(raw: string): number {
  return countBodyWords(parseFrontmatter(raw).body);
}

export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export type BlogPost = BlogFrontmatter & {
  active: boolean;
  body: string;
  wordCount: number;
};

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeBlogPost(input: Partial<BlogPost>): BlogPost | string {
  const slug = asTrimmedString(input.slug).toLowerCase();
  const title = asTrimmedString(input.title);
  const excerpt = asTrimmedString(input.excerpt);
  const body = typeof input.body === "string" ? input.body.replace(/\r\n/g, "\n").trim() : "";
  const publishedAt = asTrimmedString(input.publishedAt);
  const updatedAt = asTrimmedString(input.updatedAt) || publishedAt;
  const primaryTestId = asTrimmedString(input.primaryTestId) || "attachment-style";
  const readMinutes = Number(input.readMinutes);
  if (!BLOG_SLUG_PATTERN.test(slug) || slug.length > 120) return "URL 使用小写字母、数字和连字符，例如 anxious-attachment。";
  if (!title || title.length > 200) return "请填写 200 字以内的英文标题。";
  if (!excerpt || excerpt.length > 600) return "请填写 600 字以内的英文摘要。";
  if (!body || body.length > 80000) return "请填写正文。";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt) || !/^\d{4}-\d{2}-\d{2}$/.test(updatedAt)) return "发布日期和更新日期须为 YYYY-MM-DD。";
  if (!primaryTestId || primaryTestId.length > 100) return "请选择关联测试。";
  if (!Number.isInteger(readMinutes) || readMinutes < 1 || readMinutes > 60) return "阅读时长须为 1 到 60 分钟。";
  if (typeof input.active !== "boolean") return "请设置上线状态。";
  return {
    slug,
    title,
    excerpt,
    body,
    publishedAt,
    updatedAt,
    readMinutes,
    primaryTestId,
    active: input.active,
    wordCount: countBodyWords(body),
  };
}
