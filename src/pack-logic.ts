import { placeAll } from './cell-grid';
import { log } from './log';
import type { Rectangle, RectangleSize } from './types';
import { maxWidthHeight, sumWidthHeight, totalArea } from './utils';

const PlacingState = {
  DoPlacing: 'DoPlacing',
  DecreaseWidth: 'DecreaseWidth',
  IncreaseHeight: 'IncreaseHeight',
  Stop: 'Stop',
} as const;
type PlacingState = (typeof PlacingState)[keyof typeof PlacingState];

/** Width of the enclosing box needed to cover every already-placed rectangle. */
const placingWidth = (list: Rectangle[]): number =>
  list.reduce((width, rect) => Math.max(width, (rect.x ?? 0) + rect.width), 0);

/**
 * Finds a near-minimal enclosing box for `list` by starting at (sum width, max height) and
 * alternately shrinking the width and growing the height until placement succeeds, then
 * re-placing at the smallest box found.
 */
const packIntoMinimalArea = (list: (Rectangle & { __id: number })[]): RectangleSize | null => {
  const { width: maxWidth, height: maxHeight } = maxWidthHeight(list);
  const { width: sumWidth } = sumWidthHeight(list);
  const totalRectArea = totalArea(list);

  let width = sumWidth;
  let height = maxHeight;
  let bestArea = width * height;
  let best: RectangleSize | null = null;
  let state: PlacingState = PlacingState.DoPlacing;

  while (state !== PlacingState.Stop) {
    switch (state) {
      case PlacingState.DoPlacing: {
        if (placeAll(list, width, height)) {
          width = placingWidth(list);
          bestArea = width * height;
          best = { width, height };
          state = PlacingState.DecreaseWidth;
        } else {
          state = PlacingState.IncreaseHeight;
        }
        break;
      }
      case PlacingState.DecreaseWidth: {
        width--;
        state = width < maxWidth ? PlacingState.Stop : PlacingState.DoPlacing;
        break;
      }
      case PlacingState.IncreaseHeight: {
        height++;
        if (height * width < totalRectArea) state = PlacingState.IncreaseHeight;
        else if (height * width >= bestArea) state = PlacingState.DecreaseWidth;
        else state = PlacingState.DoPlacing;
        break;
      }
    }
  }

  return best;
};

/** Packs `rectangleSizes` into a compact layout; returns positioned copies in the input order. */
export const rectanglePacker = <T extends RectangleSize>(rectangleSizes: T[]): Rectangle[] => {
  if (rectangleSizes.length === 0) return [];

  const rectList = rectangleSizes.map(({ width, height }, i) => {
    if (width <= 0 || height <= 0) {
      throw new Error(`Rectangle at index ${i} must have positive width and height, got: ${width}x${height}`);
    }
    return { width, height, x: -1, y: -1, __id: i + 1 };
  });

  const best = packIntoMinimalArea(rectList);
  if (best === null) {
    log('Unexpected error in algorithm implementation');
    return [];
  }

  placeAll(rectList, best.width, best.height);

  return rectList.map(({ width, height, x, y }) => ({ width, height, x, y }));
};

/** Same as {@link rectanglePacker}, but writes `x`/`y` back onto the input rectangles. */
export const rectanglePackerMutation = <T extends Rectangle>(rectangleSizes: T[]): (T & Rectangle)[] => {
  const placed = rectanglePacker(rectangleSizes);

  rectangleSizes.forEach((rect, i) => {
    rect.x = placed[i].x;
    rect.y = placed[i].y;
  });

  return rectangleSizes;
};
