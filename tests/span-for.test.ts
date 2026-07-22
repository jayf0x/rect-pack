import { describe, expect, test } from 'bun:test';
import { spanFor } from '../src/utils';

describe('spanFor', () => {
  test('both cols and rows pinned: exact, weight ignored', () => {
    expect(spanFor({ cols: 3, rows: 2, weight: 99 }, 6)).toEqual({ colSpan: 3, rowSpan: 2 });
  });

  test('only cols pinned: rowSpan falls back to weight (rounded)', () => {
    expect(spanFor({ cols: 3, weight: 4 }, 6)).toEqual({ colSpan: 3, rowSpan: 4 });
    expect(spanFor({ cols: 3 }, 6)).toEqual({ colSpan: 3, rowSpan: 1 });
  });

  test('only rows pinned: colSpan falls back to weight (rounded)', () => {
    expect(spanFor({ rows: 2, weight: 3 }, 6)).toEqual({ colSpan: 3, rowSpan: 2 });
  });

  test('neither pinned: aims for a weight-sized square', () => {
    expect(spanFor({}, 6)).toEqual({ colSpan: 1, rowSpan: 1 });
    expect(spanFor({ weight: 4 }, 6)).toEqual({ colSpan: 2, rowSpan: 2 });
  });

  test('pinned cols is clamped to the available columns', () => {
    expect(spanFor({ cols: 99, rows: 1 }, 6)).toEqual({ colSpan: 6, rowSpan: 1 });
  });

  test('weight-derived span is clamped to the available columns', () => {
    expect(spanFor({ rows: 1, weight: 99 }, 6)).toEqual({ colSpan: 6, rowSpan: 1 });
  });
});
