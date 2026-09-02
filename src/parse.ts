import { createRequire } from 'node:module';

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
  // gray-matter measured ~6s to import on this filesystem - deferred so callers that
  // never actually parse a file (--version, empty-directory, missing-directory) don't
  // pay that cost. require() caches after the first real call within a process.
  const matter = createRequire(import.meta.url)('gray-matter') as (input: string) => { data: unknown; content: string };
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
