/**
 * Grid-slot allocator: the "auto" packer.
 *
 * A **squarified treemap** (Bruls, Huizing & van Wijk; ported from `d3-hierarchy`'s
 * `squarify.js`) in continuous `[0,1] x [0,1]` space. Every item's *area* is proportional to its
 * `weight` — not just one axis — so aspect ratios stay near-square regardless of how many columns
 * the container nominally has, which is what a integer binary-split allocator can't guarantee (a
 * heavy item in a narrow grid used to collapse back to 1x1). The container is filled exactly:
 * output rects always tile the unit square with no gaps or overlaps.
 *
 * `cols`/`rows` only shape the *nominal aspect ratio* squarify targets (more of either spreads
 * items out before they get cramped) — they are not a hard grid; output is fractional, and edges
 * are never snapped to integer cell lines.
 */

import type { GridInput, GridOptions, GridPlacement } from './types';

type Rect = { x: number; y: number; w: number; h: number };
type Weighted = { id: GridInput['id']; weight: number };

const PHI = (1 + Math.sqrt(5)) / 2;

/** Lays `row` left-to-right across the fixed-height strip `[x0,x1] x [y0,y1]`. */
const dice = (
  row: Weighted[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  out: Map<GridInput['id'], Rect>,
): void => {
  const total = row.reduce((s, it) => s + it.weight, 0);
  const k = total > 0 ? (x1 - x0) / total : 0;
  let x = x0;
  for (const it of row) {
    const w = it.weight * k;
    out.set(it.id, { x, y: y0, w, h: y1 - y0 });
    x += w;
  }
};

/** Lays `row` top-to-bottom down the fixed-width strip `[x0,x1] x [y0,y1]`. */
const slice = (
  row: Weighted[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  out: Map<GridInput['id'], Rect>,
): void => {
  const total = row.reduce((s, it) => s + it.weight, 0);
  const k = total > 0 ? (y1 - y0) / total : 0;
  let y = y0;
  for (const it of row) {
    const h = it.weight * k;
    out.set(it.id, { x: x0, y, w: x1 - x0, h });
    y += h;
  }
};

/**
 * Squarified treemap over `items` (must be pre-sorted, descending by weight — that's not
 * stylistic, it's what keeps the row-growing loop below near-square at all; fed unsorted, a heavy
 * item can land in a row with the wrong neighbors and stretch into a sliver, see
 * `tests/core.test.ts` for how much worse). The trade-off this buys: an item's rank among the
 * others, and so its position, can shift when its weight crosses another item's — inherent to
 * *every* aspect-ratio-optimal treemap, not a bug in this port (see `docs/why.md`).
 */
const squarify = (
  items: Weighted[],
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  out: Map<GridInput['id'], Rect>,
): void => {
  const n = items.length;
  let value = items.reduce((s, it) => s + it.weight, 0);
  let i0 = 0;

  while (i0 < n) {
    const dx = x1 - x0;
    const dy = y1 - y0;

    let i1 = i0;
    let sumValue = items[i1++].weight;
    let minValue = sumValue;
    let maxValue = sumValue;
    const alpha = Math.max(dy / dx, dx / dy) / (value * PHI);
    let beta = sumValue * sumValue * alpha;
    let minRatio = Math.max(maxValue / beta, beta / minValue);

    // Grow the row while its worst aspect ratio keeps improving.
    for (; i1 < n; i1++) {
      const v = items[i1].weight;
      sumValue += v;
      if (v < minValue) minValue = v;
      if (v > maxValue) maxValue = v;
      beta = sumValue * sumValue * alpha;
      const newRatio = Math.max(maxValue / beta, beta / minValue);
      if (newRatio > minRatio) {
        sumValue -= v;
        break;
      }
      minRatio = newRatio;
    }

    const row = items.slice(i0, i1);
    if (dx < dy) {
      const ySplit = value ? y0 + (dy * sumValue) / value : y1;
      dice(row, x0, y0, x1, ySplit, out);
      y0 = ySplit;
    } else {
      const xSplit = value ? x0 + (dx * sumValue) / value : x1;
      slice(row, x0, y0, xSplit, y1, out);
      x0 = xSplit;
    }
    value -= sumValue;
    i0 = i1;
  }
};

/**
 * The nominal `[cols x rows]` aspect ratio squarify targets. A soft grid never drops an item —
 * `rows` grows to fit if there are more items than `cols * rows`.
 */
export const neededRows = (count: number, cols: number, rows: number): number =>
  Math.max(rows, Math.ceil(count / cols));

/**
 * Places every item as a fractional rect tiling the unit square. Output order matches input.
 */
export const layoutGrid = <T extends GridInput>(
  items: T[],
  { cols = 7, rows = 7, preserveOrder = false }: GridOptions = {},
): GridPlacement[] => {
  if (items.length === 0) return [];
  if (cols < 1) throw new Error(`cols must be >= 1, got ${cols}`);

  const rowsUsed = neededRows(items.length, cols, rows);
  const weighted: Weighted[] = items.map((it) => ({
    id: it.id,
    weight: it.weight && it.weight > 0 ? it.weight : 1,
  }));
  // Sorting descending keeps rows near-square; skipping it keeps input order (position control).
  const ordered = preserveOrder ? weighted : [...weighted].sort((a, b) => b.weight - a.weight);

  const out = new Map<GridInput['id'], Rect>();
  squarify(ordered, 0, 0, cols, rowsUsed, out);

  return items.map((it) => {
    const r = out.get(it.id) as Rect;
    return {
      id: it.id,
      x: r.x / cols,
      y: r.y / rowsUsed,
      w: r.w / cols,
      h: r.h / rowsUsed,
    };
  });
};
