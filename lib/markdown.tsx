import type { ReactNode } from "react";
import { countMarkdownWords, parseFrontmatter } from "@/lib/blog-parse";

export { countMarkdownWords, parseFrontmatter };

function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  const pattern = /\*\*([^*]+)\*\*|\*([^*]+)\*|\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text))) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index));
    if (match[1]) nodes.push(<strong key={`${keyPrefix}-b-${index}`}>{match[1]}</strong>);
    else if (match[2]) nodes.push(<em key={`${keyPrefix}-i-${index}`}>{match[2]}</em>);
    else {
      const href = match[4];
      const external = href.startsWith("http");
      nodes.push(
        <a
          href={href}
          key={`${keyPrefix}-a-${index}`}
          rel={external ? "noopener noreferrer" : undefined}
          target={external ? "_blank" : undefined}
        >
          {match[3]}
        </a>,
      );
    }
    lastIndex = match.index + match[0].length;
    index += 1;
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex));
  return nodes;
}

function renderBlocks(markdown: string, keyPrefix: string): ReactNode[] {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: { ordered: boolean; text: string }[] = [];
  let listOrdered = false;
  let blockIndex = 0;

  const flushParagraph = () => {
    if (!paragraph.length) return;
    const text = paragraph.join(" ");
    nodes.push(<p key={`${keyPrefix}-p-${blockIndex}`}>{renderInline(text, `${keyPrefix}-p-${blockIndex}`)}</p>);
    paragraph = [];
    blockIndex += 1;
  };

  const flushList = () => {
    if (!listItems.length) return;
    const ListTag = listOrdered ? "ol" : "ul";
    nodes.push(
      <ListTag key={`${keyPrefix}-l-${blockIndex}`}>
        {listItems.map((item, itemIndex) => (
          <li key={`${keyPrefix}-li-${blockIndex}-${itemIndex}`}>
            {renderInline(item.text, `${keyPrefix}-li-${blockIndex}-${itemIndex}`)}
          </li>
        ))}
      </ListTag>,
    );
    listItems = [];
    blockIndex += 1;
  };

  for (const line of lines) {
    const heading = line.match(/^(#{2,3})\s+(.+)$/);
    const unordered = line.match(/^[-*]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    if (heading) {
      flushParagraph();
      flushList();
      const Tag = heading[1].length === 2 ? "h2" : "h3";
      nodes.push(
        <Tag key={`${keyPrefix}-h-${blockIndex}`}>
          {renderInline(heading[2], `${keyPrefix}-h-${blockIndex}`)}
        </Tag>,
      );
      blockIndex += 1;
      continue;
    }

    if (unordered || ordered) {
      flushParagraph();
      const nextOrdered = Boolean(ordered);
      if (listItems.length && listOrdered !== nextOrdered) flushList();
      listOrdered = nextOrdered;
      listItems.push({ ordered: nextOrdered, text: (unordered?.[1] ?? ordered?.[1] ?? "").trim() });
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();
  return nodes;
}

export function renderMarkdown(body: string, cta: ReactNode): ReactNode[] {
  return body.split(/\n*<!-- CTA -->\n*/).flatMap((part, index, parts) => {
    const rendered = part.trim() ? renderBlocks(part.trim(), `part-${index}`) : [];
    if (index < parts.length - 1) rendered.push(<div key={`cta-${index}`}>{cta}</div>);
    return rendered;
  });
}
