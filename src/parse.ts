import matter from 'gray-matter';

export interface ParsedMemoryFile {
  name: string;
  description?: string;
  type: string;
  body: string;
  sourceLabel: string;
  mtimeMs?: number;
}

export interface ParseError {
  error: string;
}

interface FrontmatterData {
  name?: unknown;
  description?: unknown;
  metadata?: { type?: unknown };
}

/**
 * Pure parse of one memory file's raw text. Does not touch the filesystem so it can be
 * unit tested with inline strings; `loadMemoryDir` fills in `mtimeMs` from a real stat.
 */
export function parseMemoryFileContent(raw: string, sourceLabel: string): ParsedMemoryFile | ParseError {
  let data: FrontmatterData;
  let body: string;
  try {
    const parsed = matter(raw);
    data = parsed.data as FrontmatterData;
    body = parsed.content;
  } catch (err) {
    return { error: `invalid frontmatter (${(err as Error).message})` };
  }

  if (typeof data.name !== 'string' || data.name.trim() === '') {
    return { error: 'missing required "name" field' };
  }

  const type = typeof data.metadata?.type === 'string' ? data.metadata.type : 'reference';

  return {
    name: data.name,
    description: typeof data.description === 'string' ? data.description : undefined,
    type,
    body,
    sourceLabel,
  };
}
