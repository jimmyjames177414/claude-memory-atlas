import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = createRequire(import.meta.url)('../package.json') as { version: string };
const BIN = path.join(__dirname, '..', 'dist', 'index.js');

describe('--version', () => {
  it('prints the package version and exits 0', () => {
    const out = execFileSync('node', [BIN, '--version'], { encoding: 'utf-8' });
    expect(out.trim()).toBe(pkg.version);
  });
});
