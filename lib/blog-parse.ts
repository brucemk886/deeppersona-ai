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

export function countMarkdownWords(raw: string): number {
  const { body } = parseFrontmatter(raw);
  const text = body
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_>`-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return text ? text.split(" ").length : 0;
}
