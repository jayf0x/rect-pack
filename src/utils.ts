import { Children, isValidElement, ReactElement, type ReactNode } from "react";
import { GridItem, type GridItemProps } from "./react";

export const toCss = (n: number | string): string =>
  typeof n === "number" ? `${n}px` : n;

export const useReducedMotion = (): boolean =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);

/** Valid elements among `children`, matching `isTarget`. A profiler/compiler (e.g. Million Lint)
 * can wrap each element in an instrumentation component, pushing the real one into
 * `props.children` — so an element that fails `isTarget` gets one look one level down before
 * being kept as-is. No `isTarget` means no filtering or unwrapping. */
export const asGridItems = (children: ReactNode) =>
  Children.toArray(children).reduce<ReactElement<GridItemProps>[]>(
    (items, el) => {
      if (!isValidElement(el)) {
        return items;
      }

      let item = el as ReactElement<GridItemProps>;
      if (item.type !== GridItem) {
        const child = (el.props as { children?: unknown }).children;

        item = (
          isValidElement(child) && child.type === GridItem ? child : el
        ) as ReactElement<GridItemProps>;
      }

      items.push(item);
      return items;
    },
    [],
  );

/** Shallow-merges `obj` over `defaults`, keeping the default for any key that's missing or
 * explicitly `undefined` in `obj` — so an omitted prop and an explicit `prop={undefined}` behave
 * the same. */
export function mergeDefaults<T extends object>(obj: Partial<T>, defaults: T): T {
  const out = { ...defaults };

  for (const key in obj) {
    const value = obj[key];
    if (value !== undefined) out[key] = value as T[typeof key];
  }

  return out;
}

const clampCols = (n: number, cols: number): number =>
  Math.max(1, Math.min(cols, Math.round(n)));

/** Row/column span for one item in pinned-span mode. The pinned axis is exact; the free axis (if
 * any) falls back to `weight`, and an item with neither pin just aims for a `weight`-sized square. */
export const spanFor = (
  props: GridItemProps,
  cols: number,
): { colSpan: number; rowSpan: number } => {
  const weight =
    typeof props.weight === "number" && props.weight > 0 ? props.weight : 1;

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
