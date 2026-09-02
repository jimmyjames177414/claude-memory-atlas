import { describe, it, expect } from 'vitest';
import { parseMemoryFileContent } from '../src/parse.js';

describe('parseMemoryFileContent', () => {
  it('parses a well-formed memory file into the expected node shape', () => {
    const raw = `---
name: sample-slug
description: A one-line summary.
metadata:
  type: project
---
Some body text with a [[wikilink]].`;

    const result = parseMemoryFileContent(raw, 'sample-slug.md');

    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.name).toBe('sample-slug');
    expect(result.description).toBe('A one-line summary.');
    expect(result.type).toBe('project');
    expect(result.body).toContain('[[wikilink]]');
    expect(result.sourceLabel).toBe('sample-slug.md');
  });

  it('defaults type to "reference" when metadata.type is absent', () => {
    const raw = `---
name: no-type-slug
---
Body.`;
    const result = parseMemoryFileContent(raw, 'no-type-slug.md');
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.type).toBe('reference');
  });

  it('skips a file missing the required name field, without throwing', () => {
    const raw = `---
description: No name here.
metadata:
  type: reference
---
Body text.`;

    expect(() => parseMemoryFileContent(raw, 'broken.md')).not.toThrow();
    const result = parseMemoryFileContent(raw, 'broken.md');
    expect('error' in result).toBe(true);
  });

  it('skips a file whose name field is an empty string', () => {
    const raw = `---
name: "   "
---
Body.`;
    const result = parseMemoryFileContent(raw, 'blank-name.md');
    expect('error' in result).toBe(true);
  });
});
