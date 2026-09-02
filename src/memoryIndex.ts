export interface IndexLink {
  title: string;
  file: string;
}

const MARKDOWN_LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

/**
 * Extracts `[Title](file.md)` links from a MEMORY.md index. Order in the file is
 * preserved; a fresh RegExp is built per call for the same reason as extractWikilinks.
 */
export function parseMemoryIndexLinks(content: string): IndexLink[] {
  const pattern = new RegExp(MARKDOWN_LINK_PATTERN);
  const links: IndexLink[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(content)) !== null) {
    links.push({ title: match[1].trim(), file: match[2].trim() });
  }
  return links;
}
