import { FreeRectChoiceHeuristic, GuillotineSplitHeuristic, type Rect } from './types';

export const createRect = (x = 0, y = 0, width = 0, height = 0): Rect => ({ x, y, width, height });

/** True if `r` fits inside `freeRect`, possibly rotated. */
export const fits = (r: Rect, freeRect: Rect): boolean =>
  (r.width <= freeRect.width && r.height <= freeRect.height) ||
  (r.height <= freeRect.width && r.width <= freeRect.height);

/** True if `r` fits `freeRect` exactly, i.e. the leftover area is 0. */
export const fitsPerfectly = (r: Rect, freeRect: Rect): boolean =>
  (r.width === freeRect.width && r.height === freeRect.height) ||
  (r.height === freeRect.width && r.width === freeRect.height);

const scoreBestAreaFit = (width: number, height: number, freeRect: Rect): number =>
  freeRect.width * freeRect.height - width * height;

const scoreBestShortSideFit = (width: number, height: number, freeRect: Rect): number =>
  Math.min(Math.abs(freeRect.width - width), Math.abs(freeRect.height - height));

const scoreBestLongSideFit = (width: number, height: number, freeRect: Rect): number =>
  Math.max(Math.abs(freeRect.width - width), Math.abs(freeRect.height - height));

/** Score for placing `width` x `height` into `freeRect`; lower is better. Does not consider rotation. */
export const scoreByHeuristic = (
  width: number,
  height: number,
  freeRect: Rect,
  heuristic: FreeRectChoiceHeuristic,
): number => {
  switch (heuristic) {
    case FreeRectChoiceHeuristic.BestAreaFit:
      return scoreBestAreaFit(width, height, freeRect);
    case FreeRectChoiceHeuristic.BestShortSideFit:
      return scoreBestShortSideFit(width, height, freeRect);
    case FreeRectChoiceHeuristic.BestLongSideFit:
      return scoreBestLongSideFit(width, height, freeRect);
    case FreeRectChoiceHeuristic.WorstAreaFit:
      return -scoreBestAreaFit(width, height, freeRect);
    case FreeRectChoiceHeuristic.WorstShortSideFit:
      return -scoreBestShortSideFit(width, height, freeRect);
    case FreeRectChoiceHeuristic.WorstLongSideFit:
      return -scoreBestLongSideFit(width, height, freeRect);
    default:
      return Number.MAX_VALUE;
  }
};

/** Decides whether to split the leftover L-shape horizontally, per the given heuristic. */
const shouldSplitHorizontal = (freeRect: Rect, placedRect: Rect, heuristic: GuillotineSplitHeuristic): boolean => {
  const leftoverWidth = freeRect.width - placedRect.width;
  const leftoverHeight = freeRect.height - placedRect.height;

  switch (heuristic) {
    case GuillotineSplitHeuristic.ShorterLeftoverAxis:
      return leftoverWidth <= leftoverHeight;
    case GuillotineSplitHeuristic.LongerLeftoverAxis:
      return leftoverWidth > leftoverHeight;
    case GuillotineSplitHeuristic.MinimizeArea:
      return placedRect.width * leftoverHeight > leftoverWidth * placedRect.height;
    case GuillotineSplitHeuristic.MaximizeArea:
      return placedRect.width * leftoverHeight <= leftoverWidth * placedRect.height;
    case GuillotineSplitHeuristic.ShorterAxis:
      return freeRect.width <= freeRect.height;
    case GuillotineSplitHeuristic.LongerAxis:
      return freeRect.width > freeRect.height;
    default:
      return true;
  }
};

/**
 * Placing `placedRect` inside `freeRect` leaves an L-shaped free area, which splits into two
 * disjoint rectangles along a single horizontal or vertical line. Returns only the non-degenerate ones.
 */
const splitFreeRectAlongAxis = (freeRect: Rect, placedRect: Rect, splitHorizontal: boolean): Rect[] => {
  const bottom = createRect(freeRect.x, freeRect.y + placedRect.height, 0, freeRect.height - placedRect.height);
  const right = createRect(freeRect.x + placedRect.width, freeRect.y, freeRect.width - placedRect.width, 0);

  if (splitHorizontal) {
    bottom.width = freeRect.width;
    right.height = placedRect.height;
  } else {
    bottom.width = placedRect.width;
    right.height = freeRect.height;
  }

  return [bottom, right].filter((rect) => rect.width > 0 && rect.height > 0);
};

/** Merges adjacent free rectangles that share a full edge, mutating `freeRectangles` in place. */
const mergeFreeList = (freeRectangles: Rect[]): void => {
  for (let i = 0; i < freeRectangles.length; ++i) {
    for (let j = i + 1; j < freeRectangles.length; ++j) {
      const a = freeRectangles[i];
      const b = freeRectangles[j];

      if (a.width === b.width && a.x === b.x) {
        if (a.y === b.y + b.height) {
          a.y -= b.height;
          a.height += b.height;
          freeRectangles.splice(j, 1);
          --j;
        } else if (a.y + a.height === b.y) {
          a.height += b.height;
          freeRectangles.splice(j, 1);
          --j;
        }
      } else if (a.height === b.height && a.y === b.y) {
        if (a.x === b.x + b.width) {
          a.x -= b.width;
          a.width += b.width;
          freeRectangles.splice(j, 1);
          --j;
        } else if (a.x + a.width === b.x) {
          a.width += b.width;
          freeRectangles.splice(j, 1);
          --j;
        }
      }
    }
  }
};

export type GuillotineBinPack<T extends Rect> = {
  readonly binWidth: number;
  readonly binHeight: number;
  readonly allowFlip: boolean;
  readonly usedRectangles: T[];
  readonly freeRectangles: Rect[];
  /** Packs as many of `rects` as fit; unfit rectangles are left untouched in the array. */
  insertSizes(
    rects: T[],
    merge: boolean,
    rectChoice: FreeRectChoiceHeuristic,
    splitMethod: GuillotineSplitHeuristic,
  ): void;
  /** Ratio of used surface area to total bin area, in [0, 1]. */
  occupancy(): number;
};

/** Creates a Guillotine bin packer for a bin of the given size. */
export const createGuillotineBinPack = <T extends Rect>(
  binWidth = 0,
  binHeight = 0,
  allowFlip = false,
): GuillotineBinPack<T> => {
  const usedRectangles: T[] = [];
  const freeRectangles: Rect[] = binWidth > 0 && binHeight > 0 ? [createRect(0, 0, binWidth, binHeight)] : [];

  const insertSizes = (
    rects: T[],
    merge: boolean,
    rectChoice: FreeRectChoiceHeuristic,
    splitMethod: GuillotineSplitHeuristic,
  ): void => {
    if (rects.length === 0) return;

    for (const rect of rects) {
      if (rect.width < 0 || rect.height < 0) return;
    }

    while (rects.length > 0) {
      let bestScore = Number.MAX_VALUE;
      let bestFreeRectIndex = 0;
      let bestRectIndex = 0;
      let bestFlipped = false;
      let foundPerfectFit = false;

      for (let i = 0; i < freeRectangles.length && !foundPerfectFit; ++i) {
        const freeRect = freeRectangles[i];

        for (let j = 0; j < rects.length; ++j) {
          const rect = rects[j];

          if (fitsPerfectly(rect, freeRect)) {
            bestFreeRectIndex = i;
            bestRectIndex = j;
            bestFlipped = allowFlip && rect.width !== freeRect.width;
            foundPerfectFit = true;
            break;
          }

          if (rect.width <= freeRect.width && rect.height <= freeRect.height) {
            const score = scoreByHeuristic(rect.width, rect.height, freeRect, rectChoice);
            if (score < bestScore) {
              bestFreeRectIndex = i;
              bestRectIndex = j;
              bestFlipped = false;
              bestScore = score;
            }
          } else if (allowFlip && rect.height <= freeRect.width && rect.width <= freeRect.height) {
            const score = scoreByHeuristic(rect.height, rect.width, freeRect, rectChoice);
            if (score < bestScore) {
              bestFreeRectIndex = i;
              bestRectIndex = j;
              bestFlipped = true;
              bestScore = score;
            }
          }
        }
      }

      if (!foundPerfectFit && bestScore === Number.MAX_VALUE) return;

      const [node] = rects.splice(bestRectIndex, 1);
      const chosenFreeRect = freeRectangles[bestFreeRectIndex];

      node.x = chosenFreeRect.x;
      node.y = chosenFreeRect.y;
      if (bestFlipped) [node.width, node.height] = [node.height, node.width];

      const placedRect = createRect(chosenFreeRect.x, chosenFreeRect.y, node.width, node.height);

      freeRectangles.push(
        ...splitFreeRectAlongAxis(chosenFreeRect, placedRect, shouldSplitHorizontal(chosenFreeRect, placedRect, splitMethod)),
      );
      freeRectangles.splice(bestFreeRectIndex, 1);

      if (merge) mergeFreeList(freeRectangles);

      usedRectangles.push(node);
    }
  };

  const occupancy = (): number => {
    const usedSurfaceArea = usedRectangles.reduce((area, rect) => area + rect.width * rect.height, 0);
    return usedSurfaceArea / (binWidth * binHeight);
  };

  return { binWidth, binHeight, allowFlip, usedRectangles, freeRectangles, insertSizes, occupancy };
};
