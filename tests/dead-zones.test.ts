import { describe, expect, test } from 'bun:test';
import { analyzeItems, analyzeItemsFilled, analyzeSpans, showcaseItems } from '../scripts/dead-zones';

const s = (colSpan: number, rowSpan: number) => ({ colSpan, rowSpan });

describe('analyzeSpans', () => {
  test('a perfectly tiled row has zero dead space', () => {
    const r = analyzeSpans(
      Array.from({ length: 12 }, () => s(1, 1)),
      12,
    );
    expect(r.rows).toBe(1);
    expect(r.dead).toBe(0);
    expect(r.deadPct).toBe(0);
    expect(r.badness).toBe(0);
    expect(r.map).toBe('############');
  });

  test('widths that never reach the column count leave a trailing dead strip', () => {
    // 3 + 2 + 2 + 2 + 2 = 11 in a 12-wide grid → column 12 dies.
    const r = analyzeSpans([s(3, 1), s(2, 1), s(2, 1), s(2, 1), s(2, 1)], 12);
    expect(r.dead).toBe(1);
    expect(r.map.endsWith('.')).toBe(true);
  });

  test('badness squares per-row dead: one big hole scores worse than two small ones', () => {
    const oneBig = analyzeSpans([s(10, 1)], 12); // one row, dead 2 → badness 4
    const twoSmall = analyzeSpans([s(11, 1), s(11, 1)], 12); // two rows, dead 1 each → badness 2
    expect(oneBig.badness).toBe(4);
    expect(twoSmall.badness).toBe(2);
    expect(oneBig.badness).toBeGreaterThan(twoSmall.badness);
  });

  test('empty input reports a fully dead single row', () => {
    const r = analyzeSpans([], 6);
    expect(r.rows).toBe(1);
    expect(r.dead).toBe(6);
    expect(r.deadPct).toBe(100);
  });
});

describe('Showcase QA baseline (verbatim weightForIndex grid)', () => {
  // Anchors the real desktop layout so improvements are visible. When the engine gets smarter,
  // update these numbers deliberately — a drop is the whole point.
  test('raw order-mode layout has the dead zones we saw in QA', () => {
    const r = analyzeItems(showcaseItems(), 12);
    expect(r.rows).toBe(13); // weight-4 items are 4×4, so the grid runs tall
    expect(r.dead).toBe(30);
    expect(r.badness).toBe(106);
    // Sanity: reported dead equals the map's '.' count.
    expect(r.dead).toBe((r.map.match(/\./g) ?? []).length);
  });

  test('4-directional fill collapses the obvious gaps; the cap trades fill for gentleness', () => {
    const raw = analyzeItems(showcaseItems(), 12);
    const cap1 = analyzeItemsFilled(showcaseItems(), 12, 1);
    const cap2 = analyzeItemsFilled(showcaseItems(), 12, 2);
    const full = analyzeItemsFilled(showcaseItems(), 12, Number.POSITIVE_INFINITY);

    // The fill only grows existing items — never reflows into new rows.
    for (const r of [cap1, cap2, full]) expect(r.rows).toBe(raw.rows);

    // Monotonic: a looser cap fills at least as much.
    expect(cap1.dead).toBeLessThan(raw.dead);
    expect(cap2.dead).toBeLessThanOrEqual(cap1.dead);
    expect(full.dead).toBeLessThanOrEqual(cap2.dead);

    // Baseline anchors (see `bun scripts/dead-zones.ts`).
    expect(raw.dead).toBe(30); // 19%
    expect(cap1.dead).toBe(17); // 11%
    expect(cap2.dead).toBe(13); // 8%
    expect(full.dead).toBe(9); // 6% — remainder are 1–2 cell "eyes" beside the fixed VoidTiles
    expect(full.badness).toBe(17);
  });
});
