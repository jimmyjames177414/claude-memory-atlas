const WIKILINK_PATTERN = /\[\[([^\]]+)\]\]/g;

/**
 * Finds every [[wikilink]] target in a memory file body. Builds a fresh RegExp per call
 * (rather than reusing the module-level `g` pattern directly) so `lastIndex` state from
 * one call can never leak into the next.
 */
export function extractWikilinks(body: string): string[] {
  const pattern = new RegExp(WIKILINK_PATTERN);
  const targets: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(body)) !== null) {
    targets.push(match[1].trim());
  }
  return targets;
}
