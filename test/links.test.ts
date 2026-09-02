import { describe, it, expect } from 'vitest';
import { extractWikilinks } from '../src/links.js';

describe('extractWikilinks', () => {
  it('finds every [[...]] occurrence in a body', () => {
    const body = 'See [[alpha]] and also [[beta-two]], plus [[alpha]] again.';
    expect(extractWikilinks(body)).toEqual(['alpha', 'beta-two', 'alpha']);
  });

  it('returns an empty array when there are no wikilinks', () => {
    expect(extractWikilinks('Nothing to see here.')).toEqual([]);
  });

  it('trims incidental whitespace inside the brackets', () => {
    expect(extractWikilinks('[[ spaced-slug ]]')).toEqual(['spaced-slug']);
  });

  it('is not affected by shared regex state across repeated calls', () => {
    const body = '[[one]] [[two]] [[three]]';
    expect(extractWikilinks(body)).toEqual(['one', 'two', 'three']);
    expect(extractWikilinks(body)).toEqual(['one', 'two', 'three']);
  });
});
