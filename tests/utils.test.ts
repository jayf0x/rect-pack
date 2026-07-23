import { describe, expect, test } from 'bun:test';
import { mergeDefaults } from '../src/utils';

describe('mergeDefaults', () => {
  test('falls back to the default for a key whose value is explicitly undefined', () => {
    expect(mergeDefaults({ a: 3, b: undefined }, { a: 3, b: 2 })).toEqual({ a: 3, b: 2 });
  });

  test("keeps falsy-but-defined values (0, false, '')", () => {
    expect(mergeDefaults({ a: 0, b: false, c: '' }, { a: 1, b: true, c: 'x' })).toEqual({
      a: 0,
      b: false,
      c: '',
    });
  });

  test("an explicit undefined override can't clobber the default", () => {
    const DEFAULTS = { a: 1, b: 2 };
    const rest = { a: undefined, b: 5 };
    expect(mergeDefaults(rest, DEFAULTS)).toEqual({ a: 1, b: 5 });
  });

  test('empty object in, defaults out unchanged', () => {
    expect(mergeDefaults({}, {})).toEqual({});
  });

  // Regression: a key missing from `obj` entirely (not just `undefined`) must still fall back
  // to its default — the common case (`<Grid>` with a prop simply not passed).
  test('a key missing from obj entirely still falls back to its default', () => {
    expect(mergeDefaults({ a: 3 }, { a: 1, b: 2 })).toEqual({ a: 3, b: 2 });
  });
});
