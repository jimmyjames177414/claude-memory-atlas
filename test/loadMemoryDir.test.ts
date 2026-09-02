import { describe, it, expect, afterEach } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadMemoryDir } from '../src/loadMemoryDir.js';

let tmpDir: string | undefined;

afterEach(() => {
  if (tmpDir) {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    tmpDir = undefined;
  }
});

describe('loadMemoryDir', () => {
  it('parses good files, skips a malformed one with a warning, and does not crash', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-atlas-'));
    tmpDir = dir;
    fs.writeFileSync(
      path.join(dir, 'good.md'),
      '---\nname: good\ndescription: fine\nmetadata:\n  type: reference\n---\nBody.\n'
    );
    fs.writeFileSync(
      path.join(dir, 'bad.md'),
      '---\ndescription: no name field\nmetadata:\n  type: reference\n---\nBody.\n'
    );

    const result = loadMemoryDir(dir);

    expect(result.mdFileCount).toBe(2);
    expect(result.files.map((f) => f.name)).toEqual(['good']);
    expect(result.warnings.length).toBe(1);
    expect(result.warnings[0]).toContain('bad.md');
  });

  it('treats MEMORY.md as the index, separate from regular files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-atlas-'));
    tmpDir = dir;
    fs.writeFileSync(path.join(dir, 'good.md'), '---\nname: good\nmetadata:\n  type: reference\n---\nBody.\n');
    fs.writeFileSync(path.join(dir, 'MEMORY.md'), '# Index\n\n- [Good](good.md) — hook\n');

    const result = loadMemoryDir(dir);

    expect(result.mdFileCount).toBe(2);
    expect(result.files.map((f) => f.name)).toEqual(['good']);
    expect(result.memoryIndexContent).toContain('Good');
  });

  it('reports zero md files for a directory that has none', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'memory-atlas-'));
    tmpDir = dir;
    fs.writeFileSync(path.join(dir, 'notes.txt'), 'not markdown');

    const result = loadMemoryDir(dir);

    expect(result.mdFileCount).toBe(0);
    expect(result.files).toEqual([]);
  });
});
