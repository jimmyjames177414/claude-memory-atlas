import { describe, it, expect } from 'vitest';
import { colorForNode, radiusForDegree, TYPE_COLORS, NEUTRAL_COLOR, withOpacity } from '../src/style.js';

describe('style mapping', () => {
  it('assigns a distinct fixed color per memory type', () => {
    const colors = new Set(Object.values(TYPE_COLORS));
    expect(colors.size).toBe(Object.keys(TYPE_COLORS).length);
    expect(colors.has(NEUTRAL_COLOR)).toBe(false);
  });

  it('gives ghost and index nodes the neutral color', () => {
    expect(colorForNode({ kind: 'ghost' })).toBe(NEUTRAL_COLOR);
    expect(colorForNode({ kind: 'index' })).toBe(NEUTRAL_COLOR);
  });

  it('gives a real node its type color', () => {
    expect(colorForNode({ kind: 'project' })).toBe(TYPE_COLORS.project);
  });

  it('scales radius up with degree but never below the minimum', () => {
    const r0 = radiusForDegree(0);
    const r1 = radiusForDegree(1);
    const r10 = radiusForDegree(10);

    expect(r0).toBeGreaterThan(0);
    expect(r1).toBeGreaterThan(r0);
    expect(r10).toBeGreaterThan(r1);
  });

  it('converts a hex color and alpha into an rgba() string', () => {
    expect(withOpacity('#4C9AFF', 1)).toBe('rgba(76, 154, 255, 1.00)');
    expect(withOpacity('#4C9AFF', 0.5)).toBe('rgba(76, 154, 255, 0.50)');
  });
});
