import { describe, it, expect } from 'vitest';
import { renderHtml } from '../src/render.js';
import type { MemoryGraph } from '../src/graph.js';

describe('renderHtml', () => {
  it('escapes a literal </script> inside node content so it cannot break out of the inlined JSON', () => {
    const graph: MemoryGraph = {
      nodes: [
        {
          id: 'tricky',
          kind: 'reference',
          description: 'contains </script> literally',
          bodyHtml: '<p>closing tag test: </script></p>',
        },
      ],
      edges: [],
    };

    const html = renderHtml(graph, '/* fake force-graph bundle */');

    const openTags = html.match(/<script[^>]*>/gi) ?? [];
    const closeTags = html.match(/<\/script>/gi) ?? [];
    expect(closeTags.length).toBe(openTags.length);

    const match = html.match(/<script type="application\/json" id="memory-atlas-data">([\s\S]*?)<\/script>/);
    expect(match).not.toBeNull();
    const payload = JSON.parse(match![1]);
    expect(payload.nodes[0].description).toBe('contains </script> literally');
  });

  it('produces valid JSON containing the injected force-graph source verbatim (minus escaping)', () => {
    const graph: MemoryGraph = { nodes: [], edges: [] };
    const html = renderHtml(graph, 'window.ForceGraph = function fakeBundle() {};');
    expect(html).toContain('window.ForceGraph = function fakeBundle()');
  });
});
