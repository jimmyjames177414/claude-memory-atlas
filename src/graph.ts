import path from 'node:path';
import { marked } from 'marked';
import { extractWikilinks } from './links.js';
import { parseMemoryIndexLinks } from './memoryIndex.js';
import type { ParsedMemoryFile } from './parse.js';

export type MemoryType = 'user' | 'feedback' | 'project' | 'reference';
export type NodeKind = MemoryType | 'ghost' | 'index';

export interface MemoryNode {
  id: string;
  kind: NodeKind;
  description?: string;
  bodyHtml?: string;
  mtimeMs?: number;
  ghost?: boolean;
  isIndex?: boolean;
}

export interface MemoryEdge {
  source: string;
  target: string;
}

export interface MemoryGraph {
  nodes: MemoryNode[];
  edges: MemoryEdge[];
}

export const INDEX_NODE_ID = '__memory_index__';

const KNOWN_TYPES: ReadonlySet<string> = new Set(['user', 'feedback', 'project', 'reference']);

function normalizeType(type: string): MemoryType {
  return KNOWN_TYPES.has(type) ? (type as MemoryType) : 'reference';
}

/**
 * Builds the node/edge graph from parsed memory files plus the raw MEMORY.md content
 * (or null if no index file exists). Pure with respect to its inputs - no filesystem
 * access here, so it is unit-testable with plain in-memory fixtures.
 */
export function buildGraph(files: ParsedMemoryFile[], memoryIndexContent: string | null): MemoryGraph {
  const nodes = new Map<string, MemoryNode>();
  const edges: MemoryEdge[] = [];

  for (const file of files) {
    nodes.set(file.name, {
      id: file.name,
      kind: normalizeType(file.type),
      description: file.description,
      bodyHtml: marked.parse(file.body) as string,
      mtimeMs: file.mtimeMs,
    });
  }

  for (const file of files) {
    for (const target of extractWikilinks(file.body)) {
      if (!nodes.has(target)) {
        nodes.set(target, { id: target, kind: 'ghost', ghost: true });
      }
      edges.push({ source: file.name, target });
    }
  }

  if (memoryIndexContent !== null) {
    nodes.set(INDEX_NODE_ID, {
      id: INDEX_NODE_ID,
      kind: 'index',
      isIndex: true,
      description: 'MEMORY.md index',
    });

    for (const link of parseMemoryIndexLinks(memoryIndexContent)) {
      const targetId = resolveIndexTarget(link.file, files);
      if (targetId) {
        edges.push({ source: INDEX_NODE_ID, target: targetId });
      }
    }
  }

  return { nodes: [...nodes.values()], edges };
}

/** Best-effort match of a MEMORY.md link target to a parsed file, by filename only. */
function resolveIndexTarget(fileRef: string, files: ParsedMemoryFile[]): string | null {
  const baseName = path.basename(fileRef);
  const match = files.find((file) => path.basename(file.sourceLabel) === baseName);
  return match ? match.name : null;
}
