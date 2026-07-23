import { describe, expect, test } from 'bun:test';
import { defined } from '../src/utils';

describe('defined', () => {
  test('drops keys whose value is explicitly undefined', () => {
    expect(defined({ a: 3, b: undefined })).toEqual({ a: 3 });
  });

  test("keeps falsy-but-defined values (0, false, '')", () => {
    expect(defined({ a: 0, b: false, c: '' })).toEqual({ a: 0, b: false, c: '' });
  });

  test("spreading over defaults can't be clobbered by an explicit undefined override", () => {
    const DEFAULTS = { a: 1, b: 2 };
    const rest = { a: undefined, b: 5 };
    expect({ ...DEFAULTS, ...defined(rest) }).toEqual({ a: 1, b: 5 });
  });

  test('empty object in, empty object out', () => {
    expect(defined({})).toEqual({});
  });
});
