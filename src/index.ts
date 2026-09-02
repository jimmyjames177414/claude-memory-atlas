import { Command } from 'commander';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { loadMemoryDir } from './loadMemoryDir.js';
import { buildGraph } from './graph.js';
import { renderHtml } from './render.js';
import { openInBrowser } from './openInBrowser.js';

interface CliOptions {
  out: string;
}

function getVersion(): string {
  const require = createRequire(import.meta.url);
  return (require('../package.json') as { version: string }).version;
}

const program = new Command();

program
  .name('memory-atlas')
  .description('Render Claude Code auto-memory markdown files as a self-contained interactive HTML graph')
  .version(getVersion())
  .argument('[path]', 'directory containing memory markdown files', '.')
  .option('--out <file>', 'output HTML file path', './memory-graph.html')
  .action((inputPath: string, options: CliOptions) => {
    run(inputPath, options.out);
  });

program.parse();

function run(inputPath: string, outPath: string): void {
  const dir = path.resolve(inputPath);

  let loaded: ReturnType<typeof loadMemoryDir>;
  try {
    loaded = loadMemoryDir(dir);
  } catch (err) {
    console.error(`Error: could not read ${inputPath} (${(err as Error).message})`);
    process.exitCode = 1;
    return;
  }

  const { mdFileCount, files, warnings, memoryIndexContent } = loaded;

  for (const warning of warnings) {
    console.error(warning);
  }

  if (mdFileCount === 0) {
    console.error(`No markdown files found in ${inputPath}. Point me at a Claude Code memory directory.`);
    process.exitCode = 1;
    return;
  }

  const graph = buildGraph(files, memoryIndexContent);
  const html = renderHtml(graph);

  const resolvedOut = path.resolve(outPath);
  fs.writeFileSync(resolvedOut, html, 'utf-8');
  console.log(`Wrote ${graph.nodes.length} nodes / ${graph.edges.length} edges to ${resolvedOut}`);

  openInBrowser(resolvedOut);
}
