import { describe, it, expect, afterAll } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadMemoryDir } from '../src/loadMemoryDir.js';
import { buildGraph } from '../src/graph.js';
import { renderHtml } from '../src/render.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures');

describe('end-to-end pipeline', () => {
  let outFile: string | undefined;

  afterAll(() => {
    if (outFile && fs.existsSync(outFile)) {
      fs.rmSync(outFile);
    }
  });

  it('turns the fixture directory into a well-formed HTML file with the expected graph shape', () => {
    const { mdFileCount, files, warnings, memoryIndexContent } = loadMemoryDir(FIXTURES_DIR);

    // 6 *.md files on disk: 4 valid memory files, MEMORY.md, and one malformed file.
    expect(mdFileCount).toBe(6);
    expect(warnings.some((w) => w.includes('missing-name.md'))).toBe(true);
    expect(files.some((f) => f.name === 'missing-name')).toBe(false);
    expect(files.length).toBe(4);

    const graph = buildGraph(files, memoryIndexContent);
    const html = renderHtml(graph);

    outFile = path.join(os.tmpdir(), `memory-atlas-e2e-${Date.now()}.html`);
    fs.writeFileSync(outFile, html, 'utf-8');

    expect(fs.existsSync(outFile)).toBe(true);
    expect(fs.statSync(outFile).size).toBeGreaterThan(10_000);

    const match = html.match(/<script type="application\/json" id="memory-atlas-data">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const payload = JSON.parse(match![1]);

    // 4 real nodes + 1 ghost (ghost-roadmap-notes) + 1 index node = 6.
    expect(payload.nodes.length).toBe(6);
    // 5 wikilink edges + 3 MEMORY.md index edges = 8.
    expect(payload.links.length).toBe(8);

    const ghost = payload.nodes.find((n: { id: string }) => n.id === 'ghost-roadmap-notes');
    expect(ghost).toBeDefined();
    expect(ghost.ghost).toBe(true);

    const indexNode = payload.nodes.find((n: { isIndex: boolean }) => n.isIndex);
    expect(indexNode).toBeDefined();

    expect(html).toContain('ForceGraph');
  });
});
