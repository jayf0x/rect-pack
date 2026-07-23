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

describe('Showcase QA baseline', () => {
  // Anchors the current state so improvements are visible. When the engine gets smarter, update
  // these numbers deliberately — a drop is the whole point.
  test('desktop Showcase (order mode, cols=12) still has dead zones today', () => {
    const r = analyzeItems(showcaseItems(), 12);
    expect(r.rows).toBe(6);
    expect(r.deadPct).toBeGreaterThan(0);
    // Sanity: reported dead equals the map's '.' count.
    expect(r.dead).toBe((r.map.match(/\./g) ?? []).length);
  });

  test('the dead-zone fill lowers dead space and badness without adding rows', () => {
    const raw = analyzeItems(showcaseItems(), 12);
    const filled = analyzeItemsFilled(showcaseItems(), 12);
    expect(filled.rows).toBe(raw.rows); // fill only grows columns, never reflows rows
    expect(filled.dead).toBeLessThan(raw.dead);
    expect(filled.badness).toBeLessThanOrEqual(raw.badness);
    // Baseline anchors — a further drop is the goal; update these deliberately when it improves.
    expect(raw.dead).toBe(17);
    expect(filled.dead).toBe(15);
    // The remaining holes are structural: every gap borders a fixed item or an elastic item whose
    // second row is occupied (the HARDER case backlogged in .claude/next-agent-prompt.md §Step 3).
  });
});
