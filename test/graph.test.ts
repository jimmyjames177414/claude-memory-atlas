import { describe, it, expect } from 'vitest';
import { buildGraph } from '../src/graph.js';
import type { ParsedMemoryFile } from '../src/parse.js';

function file(partial: { name: string; body: string; type?: string }): ParsedMemoryFile {
  return {
    type: partial.type ?? 'reference',
    sourceLabel: `${partial.name}.md`,
    name: partial.name,
    body: partial.body,
  };
}

describe('buildGraph', () => {
  it('creates a real edge between two known nodes', () => {
    const files = [file({ name: 'a', body: 'links to [[b]]' }), file({ name: 'b', body: 'no links here' })];

    const graph = buildGraph(files, null);

    expect(graph.nodes.map((n) => n.id).sort()).toEqual(['a', 'b']);
    expect(graph.edges).toEqual([{ source: 'a', target: 'b' }]);
    expect(graph.nodes.find((n) => n.id === 'b')?.ghost).toBeFalsy();
  });

  it('creates a ghost node for a wikilink target that does not exist', () => {
    const files = [file({ name: 'a', body: 'links to [[nowhere]]' })];

    const graph = buildGraph(files, null);
    const ghost = graph.nodes.find((n) => n.id === 'nowhere');

    expect(ghost).toBeDefined();
    expect(ghost?.ghost).toBe(true);
    expect(ghost?.kind).toBe('ghost');
    expect(graph.edges).toEqual([{ source: 'a', target: 'nowhere' }]);
  });

  it('parses MEMORY.md into an index node with edges to the linked files', () => {
    const files = [file({ name: 'a', body: 'no links' }), file({ name: 'b', body: 'no links' })];
    const memoryMd = '# Index\n\n- [Title A](a.md) — hook\n- [Title B](b.md) — hook\n';

    const graph = buildGraph(files, memoryMd);
    const indexNode = graph.nodes.find((n) => n.isIndex);

    expect(indexNode).toBeDefined();
    const indexEdges = graph.edges.filter((e) => e.source === indexNode!.id);
    expect(indexEdges.map((e) => e.target).sort()).toEqual(['a', 'b']);
  });

  it('does not create an index node when MEMORY.md is absent', () => {
    const files = [file({ name: 'a', body: 'no links' })];

    const graph = buildGraph(files, null);

    expect(graph.nodes.some((n) => n.isIndex)).toBe(false);
  });

  it('drops a MEMORY.md link that does not match any parsed file, without crashing', () => {
    const files = [file({ name: 'a', body: 'no links' })];
    const memoryMd = '- [Title A](a.md) — hook\n- [Missing](nope.md) — hook\n';

    const graph = buildGraph(files, memoryMd);
    const indexNode = graph.nodes.find((n) => n.isIndex);
    const indexEdges = graph.edges.filter((e) => e.source === indexNode!.id);

    expect(indexEdges.map((e) => e.target)).toEqual(['a']);
  });

  it('assigns the correct memory type to each node kind', () => {
    const files = [
      file({ name: 'u', body: '', type: 'user' }),
      file({ name: 'f', body: '', type: 'feedback' }),
      file({ name: 'p', body: '', type: 'project' }),
      file({ name: 'r', body: '', type: 'reference' }),
    ];

    const graph = buildGraph(files, null);

    expect(graph.nodes.find((n) => n.id === 'u')?.kind).toBe('user');
    expect(graph.nodes.find((n) => n.id === 'f')?.kind).toBe('feedback');
    expect(graph.nodes.find((n) => n.id === 'p')?.kind).toBe('project');
    expect(graph.nodes.find((n) => n.id === 'r')?.kind).toBe('reference');
  });
});
