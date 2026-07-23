import { Children, isValidElement, type ReactElement, type ReactNode } from 'react';
import { GridItem, type GridItemProps } from './react';

export const toCss = (n: number | string): string => (typeof n === 'number' ? `${n}px` : n);

export const useReducedMotion = (): boolean =>
  typeof window !== 'undefined' && (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false);

/** Valid elements among `children`, matching `isTarget`. A profiler/compiler (e.g. Million Lint)
 * can wrap each element in an instrumentation component, pushing the real one into
 * `props.children` — so an element that fails `isTarget` gets one look one level down before
 * being kept as-is. No `isTarget` means no filtering or unwrapping. */
export const asGridItems = (children: ReactNode) =>
  Children.toArray(children).reduce<ReactElement<GridItemProps>[]>((items, el) => {
    if (!isValidElement(el)) {
      return items;
    }

    let item = el as ReactElement<GridItemProps>;
    if (item.type !== GridItem) {
      const child = (el.props as { children?: unknown }).children;

      item = (isValidElement(child) && child.type === GridItem ? child : el) as ReactElement<GridItemProps>;
    }

    items.push(item);
    return items;
  }, []);

const clamp = (n: number, max: number): number => Math.max(1, Math.min(max, Math.round(n)));

/**
 * Row/column span for one item. One rule, no overloading: `weight` is the default size for *both*
 * axes (weight 2 → a 2×2 block, so equal weights are equal squares); `cols`/`rows` override that
 * per-axis for organic shapes (`cols={4}` on a weight-2 item → 4 wide, 2 tall). Absent everywhere,
 * an item is 1×1. `colSpan` is clamped to the grid's column count so it can never overflow the row.
 */
export const spanFor = (props: GridItemProps, cols: number): { colSpan: number; rowSpan: number } => {
  const weight = typeof props.weight === 'number' && props.weight > 0 ? props.weight : 1;

  return {
    colSpan: clamp(props.cols ?? weight, cols),
    rowSpan: Math.max(1, Math.round(props.rows ?? weight)),
  };
};
