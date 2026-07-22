import { describe, expect, test } from 'bun:test';
import {
  FreeRectChoiceHeuristic,
  GuillotineSplitHeuristic,
  createGuillotineBinPack,
  createRect,
  fits,
  fitsPerfectly,
  isContainedIn,
  rectanglePacker,
  rectanglePackerMutation,
} from '../src/index';

describe('rectanglePacker', () => {
  test('packs all rectangles and assigns non-negative coords', () => {
    const rectangles = [
      { width: 100, height: 50 },
      { width: 75, height: 75 },
      { width: 200, height: 100 },
      { width: 150, height: 80 },
    ];
    const result = rectanglePacker(rectangles);
    expect(result.length).toBe(4);
    for (const r of result) {
      expect(typeof r.x).toBe('number');
      expect(typeof r.y).toBe('number');
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.y).toBeGreaterThanOrEqual(0);
    }
  });

  test('does not mutate the input array', () => {
    const rectangles = [{ width: 100, height: 50 }];
    rectanglePacker(rectangles);
    expect((rectangles[0] as { x?: number }).x).toBeUndefined();
  });

  test('preserves input order in the result', () => {
    const rectangles = [
      { width: 30, height: 10 },
      { width: 10, height: 30 },
      { width: 20, height: 20 },
    ];
    const result = rectanglePacker(rectangles);
    expect(result.map((r) => `${r.width}x${r.height}`)).toEqual(['30x10', '10x30', '20x20']);
  });

  test('non-overlapping positions for equal-sized rectangles', () => {
    const rectangles = [
      { width: 50, height: 50 },
      { width: 50, height: 50 },
      { width: 50, height: 50 },
    ];
    const result = rectanglePacker(rectangles);
    const positions = new Set(result.map((r) => `${r.x},${r.y}`));
    expect(positions.size).toBe(3);
  });

  test('single rectangle starts at origin', () => {
    const result = rectanglePacker([{ width: 100, height: 100 }]);
    expect(result[0].x).toBe(0);
    expect(result[0].y).toBe(0);
  });

  test('empty input returns empty result', () => {
    expect(rectanglePacker([]).length).toBe(0);
  });

  test('throws on non-positive width or height', () => {
    expect(() => rectanglePacker([{ width: 0, height: 10 }])).toThrow();
    expect(() => rectanglePacker([{ width: 10, height: -5 }])).toThrow();
  });

  test('placed rectangles do not overlap', () => {
    const rectangles = [
      { width: 40, height: 20 },
      { width: 20, height: 40 },
      { width: 30, height: 30 },
      { width: 10, height: 10 },
      { width: 25, height: 15 },
    ];
    const result = rectanglePacker(rectangles);

    const overlaps = (a: (typeof result)[number], b: (typeof result)[number]) =>
      a.x! < b.x! + b.width && a.x! + a.width > b.x! && a.y! < b.y! + b.height && a.y! + a.height > b.y!;

    for (let i = 0; i < result.length; i++) {
      for (let j = i + 1; j < result.length; j++) {
        expect(overlaps(result[i], result[j])).toBe(false);
      }
    }
  });
});

describe('rectanglePackerMutation', () => {
  test('mutates the input array in place', () => {
    const rectangles = [
      { width: 100, height: 50 },
      { width: 75, height: 75 },
    ];
    const result = rectanglePackerMutation(rectangles);
    expect((rectangles[0] as { x?: number }).x).toBeDefined();
    expect(JSON.stringify(result)).toBe(JSON.stringify(rectangles));
  });
});

describe('Rect', () => {
  test('createRect assigns fields with defaults', () => {
    const r = createRect(1, 2, 100, 50);
    expect(r).toEqual({ x: 1, y: 2, width: 100, height: 50 });
    expect(createRect()).toEqual({ x: 0, y: 0, width: 0, height: 0 });
  });

  test('isContainedIn', () => {
    const outer = createRect(0, 0, 100, 100);
    const inner = createRect(10, 10, 80, 80);
    const outside = createRect(200, 200, 50, 50);
    expect(isContainedIn(inner, outer)).toBe(true);
    expect(isContainedIn(outside, outer)).toBe(false);
  });

  test('isContainedIn is true for identical rects', () => {
    const r = createRect(0, 0, 50, 50);
    expect(isContainedIn(r, r)).toBe(true);
  });
});

describe('GuillotineBinPack', () => {
  test('constructor initializes bin and free list', () => {
    const packer = createGuillotineBinPack(500, 400);
    expect(packer.binWidth).toBe(500);
    expect(packer.binHeight).toBe(400);
    expect(packer.freeRectangles.length).toBe(1);
    expect(packer.usedRectangles.length).toBe(0);
  });

  test('zero-sized bin starts with no free rectangles', () => {
    const packer = createGuillotineBinPack(0, 0);
    expect(packer.freeRectangles.length).toBe(0);
  });

  test('occupancy stays within [0, 1]', () => {
    const packer = createGuillotineBinPack(500, 400);
    packer.insertSizes(
      [createRect(0, 0, 100, 100), createRect(0, 0, 50, 200)],
      true,
      FreeRectChoiceHeuristic.BestAreaFit,
      GuillotineSplitHeuristic.ShorterLeftoverAxis,
    );
    const occ = packer.occupancy();
    expect(occ).toBeGreaterThanOrEqual(0);
    expect(occ).toBeLessThanOrEqual(1);
  });

  test('packs every rectangle that fits and assigns positions', () => {
    const packer = createGuillotineBinPack(100, 100);
    const rects = [createRect(0, 0, 50, 50), createRect(0, 0, 50, 50), createRect(0, 0, 50, 50), createRect(0, 0, 50, 50)];
    packer.insertSizes(rects, true, FreeRectChoiceHeuristic.BestAreaFit, GuillotineSplitHeuristic.ShorterLeftoverAxis);
    expect(packer.usedRectangles.length).toBe(4);
    expect(packer.occupancy()).toBe(1);
  });

  test('leaves oversized rectangles unpacked in the input array', () => {
    const packer = createGuillotineBinPack(100, 100);
    const rects = [createRect(0, 0, 50, 50), createRect(0, 0, 200, 200)];
    packer.insertSizes(rects, true, FreeRectChoiceHeuristic.BestAreaFit, GuillotineSplitHeuristic.ShorterLeftoverAxis);
    expect(packer.usedRectangles.length).toBe(1);
    expect(rects.length).toBe(1);
    expect(rects[0].width).toBe(200);
  });

  test('allowFlip rotates a rectangle to make it fit', () => {
    const packer = createGuillotineBinPack(50, 100, true);
    const rects = [createRect(0, 0, 100, 50)];
    packer.insertSizes(rects, true, FreeRectChoiceHeuristic.BestAreaFit, GuillotineSplitHeuristic.ShorterLeftoverAxis);
    expect(packer.usedRectangles.length).toBe(1);
    expect(packer.usedRectangles[0].width).toBe(50);
    expect(packer.usedRectangles[0].height).toBe(100);
  });

  test('does nothing for an empty input array', () => {
    const packer = createGuillotineBinPack(100, 100);
    packer.insertSizes([], true, FreeRectChoiceHeuristic.BestAreaFit, GuillotineSplitHeuristic.ShorterLeftoverAxis);
    expect(packer.usedRectangles.length).toBe(0);
    expect(packer.freeRectangles.length).toBe(1);
  });

  test('fits and fitsPerfectly', () => {
    const freeRect = createRect(0, 0, 100, 50);
    expect(fits(createRect(0, 0, 100, 50), freeRect)).toBe(true);
    expect(fits(createRect(0, 0, 50, 100), freeRect)).toBe(true);
    expect(fits(createRect(0, 0, 200, 200), freeRect)).toBe(false);
    expect(fitsPerfectly(createRect(0, 0, 100, 50), freeRect)).toBe(true);
    expect(fitsPerfectly(createRect(0, 0, 50, 100), freeRect)).toBe(true);
    expect(fitsPerfectly(createRect(0, 0, 90, 50), freeRect)).toBe(false);
  });
});
