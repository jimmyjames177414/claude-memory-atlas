import fs from 'node:fs';
import path from 'node:path';
import { parseMemoryFileContent, type ParsedMemoryFile } from './parse.js';

export interface LoadResult {
  /** Raw count of every *.md file in the directory, including MEMORY.md and malformed files. */
  mdFileCount: number;
  files: ParsedMemoryFile[];
  warnings: string[];
  memoryIndexContent: string | null;
}

const MEMORY_INDEX_FILENAME = 'MEMORY.md';

export function loadMemoryDir(dir: string): LoadResult {
  const entries = fs.readdirSync(dir).filter((entry) => entry.toLowerCase().endsWith('.md'));
  const warnings: string[] = [];
  const files: ParsedMemoryFile[] = [];
  let memoryIndexContent: string | null = null;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    const raw = fs.readFileSync(fullPath, 'utf-8');

    if (entry === MEMORY_INDEX_FILENAME) {
      memoryIndexContent = raw;
      continue;
    }

    const result = parseMemoryFileContent(raw, entry);
    if ('error' in result) {
      warnings.push(`Skipping ${entry}: ${result.error}`);
      continue;
    }

    result.mtimeMs = fs.statSync(fullPath).mtimeMs;
    files.push(result);
  }

  return { mdFileCount: entries.length, files, warnings, memoryIndexContent };
}
