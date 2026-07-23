import { describe, expect, test } from 'bun:test';
import { layoutGrid } from '../src/core';
import type { GridInput } from '../src/types';

const EPS = 1e-9;

const equalItems = (n: number): GridInput[] => Array.from({ length: n }, (_, i) => ({ id: i }));

const totalWeight = (items: GridInput[]): number =>
  items.reduce((s, it) => s + (it.weight && it.weight > 0 ? it.weight : 1), 0);

describe('layoutGrid', () => {
  test('single item fills the whole unit square', () => {
    expect(layoutGrid([{ id: 0 }], { cols: 7, rows: 7 })).toEqual([{ id: 0, x: 0, y: 0, w: 1, h: 1 }]);
  });

  test('exact fill: rect areas sum to the whole unit square (no gaps)', () => {
    for (const n of [1, 2, 3, 5, 7, 8, 13, 20, 40, 60]) {
      const placed = layoutGrid(equalItems(n), { cols: 7, rows: 7 });
      const area = placed.reduce((s, p) => s + p.w * p.h, 0);
      expect(area).toBeCloseTo(1, 9);
    }
  });

  test('no overlap between any two rects', () => {
    const items = Array.from({ length: 25 }, (_, i) => ({
      id: i,
      weight: (i % 4) + 1,
    }));
    const placed = layoutGrid(items, { cols: 5, rows: 5 });
    for (let i = 0; i < placed.length; i++) {
      for (let j = i + 1; j < placed.length; j++) {
        const a = placed[i];
        const b = placed[j];
        const overlapX = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const overlapY = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        expect(overlapX > EPS && overlapY > EPS, `overlap between id ${a.id} and id ${b.id}`).toBe(false);
      }
    }
  });

  test('every rect stays within the [0,1] bounds', () => {
    const items = Array.from({ length: 23 }, (_, i) => ({
      id: i,
      weight: (i % 5) + 1,
    }));
    const placed = layoutGrid(items, { cols: 6, rows: 6 });
    for (const p of placed) {
      expect(p.x).toBeGreaterThanOrEqual(-EPS);
      expect(p.y).toBeGreaterThanOrEqual(-EPS);
      expect(p.x + p.w).toBeLessThanOrEqual(1 + EPS);
      expect(p.y + p.h).toBeLessThanOrEqual(1 + EPS);
    }
  });

  test('area fidelity: each rect area / total area ≈ weight / total weight', () => {
    const items: GridInput[] = [
      { id: 'hero', weight: 4 },
      ...Array.from({ length: 12 }, (_, i) => ({ id: i, weight: 1 })),
    ];
    const placed = layoutGrid(items, { cols: 5, rows: 5 });
    const totalW = totalWeight(items);
    for (const it of items) {
      const p = placed.find((pp) => pp.id === it.id)!;
      expect(p.w * p.h).toBeCloseTo((it.weight ?? 1) / totalW, 6);
    }
  });

  test('extreme weight skew still tiles exactly and keeps area proportional', () => {
    const items: GridInput[] = [{ id: 'big', weight: 1000 }, ...equalItems(30).map((it) => ({ ...it, weight: 0.01 }))];
    const placed = layoutGrid(items, { cols: 6, rows: 6 });
    const area = placed.reduce((s, p) => s + p.w * p.h, 0);
    expect(area).toBeCloseTo(1, 6);
    const big = placed.find((p) => p.id === 'big')!;
    expect(big.w * big.h).toBeCloseTo(1000 / totalWeight(items), 3);
  });

  test('aspect ratio stays bounded — squarify keeps rects near-square, not slivers', () => {
    for (const n of [2, 5, 12, 30, 60]) {
      const items = Array.from({ length: n }, (_, i) => ({
        id: i,
        weight: (i % 7) + 1,
      }));
      const placed = layoutGrid(items, { cols: 4, rows: 4 });
      for (const p of placed) {
        const ratio = Math.max(p.w / p.h, p.h / p.w);
        expect(ratio, `n=${n} id=${p.id} ratio=${ratio}`).toBeLessThan(12);
      }
    }
  });

  test('output order matches input order', () => {
    const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
    const placed = layoutGrid(items, { cols: 3, rows: 1 });
    expect(placed.map((p) => p.id)).toEqual(['a', 'b', 'c']);
  });

  test('deterministic: same input produces identical output every time', () => {
    const items = Array.from({ length: 17 }, (_, i) => ({
      id: i,
      weight: (i % 3) + 1,
    }));
    expect(layoutGrid(items, { cols: 5, rows: 5 })).toEqual(layoutGrid(items, { cols: 5, rows: 5 }));
  });

  test('more items than cols*rows grows rows rather than dropping items', () => {
    const placed = layoutGrid(equalItems(60), { cols: 4, rows: 7 });
    expect(placed.length).toBe(60);
    const area = placed.reduce((s, p) => s + p.w * p.h, 0);
    expect(area).toBeCloseTo(1, 9);
  });

  test('cols must be >= 1', () => {
    expect(() => layoutGrid([{ id: 0 }], { cols: 0 })).toThrow();
  });
});
