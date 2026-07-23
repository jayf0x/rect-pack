import { describe, expect, test } from 'bun:test';
import { packedRowCount, spanFor } from '../src/utils';

const s = (colSpan: number, rowSpan: number) => ({ colSpan, rowSpan });

describe('packedRowCount', () => {
  test('1x1 items wrap by column count', () => {
    expect(packedRowCount([s(1, 1)], 12, false)).toBe(1);
    expect(
      packedRowCount(
        Array.from({ length: 5 }, () => s(1, 1)),
        12,
        false,
      ),
    ).toBe(1);
    expect(
      packedRowCount(
        Array.from({ length: 14 }, () => s(1, 1)),
        12,
        false,
      ),
    ).toBe(2);
  });

  test('a tall/wide span pushes the row count', () => {
    expect(packedRowCount([s(2, 2), s(1, 1), s(1, 1), s(1, 1)], 4, false)).toBe(2);
  });

  test('dense back-fills the gaps a big span leaves, not adding phantom rows', () => {
    const spans = [s(2, 2), ...Array.from({ length: 6 }, () => s(1, 1))];
    expect(packedRowCount(spans, 4, true)).toBe(3);
  });

  test('never returns 0', () => {
    expect(packedRowCount([], 4, false)).toBe(1);
  });
});

describe('spanFor', () => {
  test('weight sizes both axes equally — equal weights are equal squares', () => {
    expect(spanFor({}, 6)).toEqual({ colSpan: 1, rowSpan: 1 });
    expect(spanFor({ weight: 2 }, 6)).toEqual({ colSpan: 2, rowSpan: 2 });
    expect(spanFor({ weight: 3 }, 6)).toEqual({ colSpan: 3, rowSpan: 3 });
  });

  test('cols/rows override weight per-axis (no overloading)', () => {
    expect(spanFor({ cols: 3, rows: 2, weight: 99 }, 6)).toEqual({ colSpan: 3, rowSpan: 2 });
    // cols overrides only the horizontal axis; weight still drives the vertical.
    expect(spanFor({ cols: 4, weight: 2 }, 6)).toEqual({ colSpan: 4, rowSpan: 2 });
    expect(spanFor({ rows: 5, weight: 2 }, 6)).toEqual({ colSpan: 2, rowSpan: 5 });
  });

  test('a lone pin leaves the other axis at 1 (weight defaults to 1)', () => {
    expect(spanFor({ cols: 3 }, 6)).toEqual({ colSpan: 3, rowSpan: 1 });
    expect(spanFor({ rows: 2 }, 6)).toEqual({ colSpan: 1, rowSpan: 2 });
  });

  test('colSpan is clamped to the available columns', () => {
    expect(spanFor({ cols: 99 }, 6).colSpan).toBe(6);
    expect(spanFor({ weight: 99 }, 6).colSpan).toBe(6);
  });

  test('non-positive / missing weight falls back to 1', () => {
    expect(spanFor({ weight: 0 }, 6)).toEqual({ colSpan: 1, rowSpan: 1 });
    expect(spanFor({ weight: -3 }, 6)).toEqual({ colSpan: 1, rowSpan: 1 });
  });
});
