import type { Rect, RectangleSize } from './types';

/** True if `a` fits entirely within `b`. */
export const isContainedIn = (a: Rect, b: Rect): boolean =>
  a.x >= b.x && a.y >= b.y && a.x + a.width <= b.x + b.width && a.y + a.height <= b.y + b.height;

export const sumWidthHeight = (list: RectangleSize[]): RectangleSize =>
  list.reduce((acc, rect) => ({ width: acc.width + rect.width, height: acc.height + rect.height }), {
    width: 0,
    height: 0,
  });

export const maxWidthHeight = (list: RectangleSize[]): RectangleSize =>
  list.reduce(
    (acc, rect) => ({ width: Math.max(acc.width, rect.width), height: Math.max(acc.height, rect.height) }),
    { width: 0, height: 0 },
  );

export const totalArea = (list: RectangleSize[]): number =>
  list.reduce((area, rect) => area + rect.width * rect.height, 0);
