import type { MemoryGraph, MemoryNode, MemoryType } from './graph.js';

export const TYPE_COLORS: Record<MemoryType, string> = {
  user: '#4C9AFF',
  feedback: '#F5A623',
  project: '#36B37E',
  reference: '#9C6ADE',
};

export const NEUTRAL_COLOR = '#8A8F99';

export function colorForNode(node: Pick<MemoryNode, 'kind'>): string {
  if (node.kind === 'ghost' || node.kind === 'index') {
    return NEUTRAL_COLOR;
  }
  return TYPE_COLORS[node.kind];
}

const MIN_RADIUS = 4;
const RADIUS_PER_DEGREE = 1.5;

/** Node radius scales with connection count, with a floor so isolated nodes stay visible. */
export function radiusForDegree(degree: number): number {
  return MIN_RADIUS + Math.sqrt(Math.max(degree, 0)) * RADIUS_PER_DEGREE;
}

export function computeDegrees(graph: MemoryGraph): Map<string, number> {
  const degrees = new Map<string, number>();
  for (const node of graph.nodes) {
    degrees.set(node.id, 0);
  }
  for (const edge of graph.edges) {
    degrees.set(edge.source, (degrees.get(edge.source) ?? 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) ?? 0) + 1);
  }
  return degrees;
}

const MIN_OPACITY = 0.4;
const GHOST_OR_INDEX_OPACITY = 0.6;

/**
 * Older real nodes fade toward MIN_OPACITY; ghost/index nodes have no mtime of their own
 * so they get a fixed neutral opacity instead of participating in the age scale.
 */
export function opacityForNode(node: Pick<MemoryNode, 'mtimeMs' | 'kind'>, minMtime: number, maxMtime: number): number {
  if (node.mtimeMs === undefined) {
    return GHOST_OR_INDEX_OPACITY;
  }
  if (maxMtime === minMtime) {
    return 1;
  }
  const ratio = (node.mtimeMs - minMtime) / (maxMtime - minMtime);
  return MIN_OPACITY + ratio * (1 - MIN_OPACITY);
}

/** Combines a `#rrggbb` color with an alpha value into a canvas-ready rgba() string. */
export function withOpacity(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha.toFixed(2)})`;
}

export function mtimeRange(graph: MemoryGraph): { min: number; max: number } {
  const mtimes = graph.nodes.map((n) => n.mtimeMs).filter((m): m is number => m !== undefined);
  if (mtimes.length === 0) {
    return { min: 0, max: 0 };
  }
  return { min: Math.min(...mtimes), max: Math.max(...mtimes) };
}
