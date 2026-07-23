import { Children, isValidElement, type ReactNode } from 'react';
import type { GridItemProps } from './react';

export const toCss = (n: number | string): string => (typeof n === 'number' ? `${n}px` : n);

/** Shallow-copies `obj`, dropping keys whose value is explicitly `undefined` — so spreading the
 * result over a defaults object can't clobber a default with an explicit `undefined`. */
export const defined = <T extends object>(obj: T): Partial<T> => {
  const out: Partial<T> = {};
  for (const key of Object.keys(obj) as (keyof T)[]) {
    if (obj[key] !== undefined) out[key] = obj[key];
  }
  return out;
};

export const useReducedMotion = (): boolean =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

export const asValidElements = <T>(children: ReactNode): React.ReactElement<T>[] =>
  Children.toArray(children).filter(isValidElement) as React.ReactElement<T>[];

const clampCols = (n: number, cols: number): number => Math.max(1, Math.min(cols, Math.round(n)));

/** Row/column span for one item in pinned-span mode. The pinned axis is exact; the free axis (if
 * any) falls back to `weight`, and an item with neither pin just aims for a `weight`-sized square. */
export const spanFor = (props: GridItemProps, cols: number): { colSpan: number; rowSpan: number } => {
  const weight = typeof props.weight === 'number' && props.weight > 0 ? props.weight : 1;

  if (props.cols != null && props.rows != null) {
    return {
      colSpan: clampCols(props.cols, cols),
      rowSpan: Math.max(1, Math.round(props.rows)),
    };
  }

  if (props.cols != null) {
    return {
      colSpan: clampCols(props.cols, cols),
      rowSpan: Math.max(1, Math.round(weight)),
    };
  }

  if (props.rows != null) {
    return {
      colSpan: clampCols(weight, cols),
      rowSpan: Math.max(1, Math.round(props.rows)),
    };
  }

  const side = Math.max(1, Math.round(Math.sqrt(weight)));
  return { colSpan: Math.min(cols, side), rowSpan: side };
};
