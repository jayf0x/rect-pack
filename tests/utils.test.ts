import { describe, expect, test } from 'bun:test';
import { createRect } from '../src/core';
import { log } from '../src/log';
import { isContainedIn, maxWidthHeight, sumWidthHeight, totalArea } from '../src/utils';

describe('isContainedIn', () => {
  test('true when fully inside', () => {
    expect(isContainedIn(createRect(10, 10, 80, 80), createRect(0, 0, 100, 100))).toBe(true);
  });

  test('false when outside bounds', () => {
    expect(isContainedIn(createRect(90, 90, 20, 20), createRect(0, 0, 100, 100))).toBe(false);
  });

  test('true for identical rects', () => {
    const r = createRect(0, 0, 50, 50);
    expect(isContainedIn(r, r)).toBe(true);
  });
});

describe('sumWidthHeight', () => {
  test('sums widths and heights independently', () => {
    expect(
      sumWidthHeight([
        { width: 10, height: 5 },
        { width: 20, height: 15 },
      ]),
    ).toEqual({ width: 30, height: 20 });
  });

  test('empty list sums to zero', () => {
    expect(sumWidthHeight([])).toEqual({ width: 0, height: 0 });
  });
});

describe('maxWidthHeight', () => {
  test('takes the max of each dimension independently', () => {
    expect(
      maxWidthHeight([
        { width: 10, height: 50 },
        { width: 20, height: 15 },
      ]),
    ).toEqual({ width: 20, height: 50 });
  });

  test('empty list maxes to zero', () => {
    expect(maxWidthHeight([])).toEqual({ width: 0, height: 0 });
  });
});

describe('totalArea', () => {
  test('sums width * height for every rect', () => {
    expect(
      totalArea([
        { width: 10, height: 5 },
        { width: 2, height: 3 },
      ]),
    ).toBe(56);
  });

  test('empty list has zero area', () => {
    expect(totalArea([])).toBe(0);
  });
});

describe('log', () => {
  test('does not throw', () => {
    expect(() => log('hello', 1, { a: 1 })).not.toThrow();
  });
});
