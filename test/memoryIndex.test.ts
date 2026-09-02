import { describe, it, expect } from 'vitest';
import { parseMemoryIndexLinks } from '../src/memoryIndex.js';

describe('parseMemoryIndexLinks', () => {
  it('extracts title and file from each markdown link line', () => {
    const content = `# Memory Index

- [Hobby profile](user-hobbies.md) — fictional hook
- [Lantern status](project-lantern.md) — another hook
`;
    expect(parseMemoryIndexLinks(content)).toEqual([
      { title: 'Hobby profile', file: 'user-hobbies.md' },
      { title: 'Lantern status', file: 'project-lantern.md' },
    ]);
  });

  it('returns an empty array for content with no links', () => {
    expect(parseMemoryIndexLinks('# Empty index\n\nNothing here yet.\n')).toEqual([]);
  });
});
