import { describe, expect, test } from 'bun:test';
import { spanFor } from '../src/utils';

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
