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

export type Span = { colSpan: number; rowSpan: number };

/** Where one item lands. Starts are **0-indexed**; add 1 for CSS `grid-column-start`/`grid-row-start`. */
export type Placement = { colStart: number; rowStart: number; colSpan: number; rowSpan: number };

export type Placed = {
  /** One entry per input span, in input order. */
  placements: Placement[];
  /** Rows occupied (>= 1). */
  rows: number;
  /** `occupancy[r][c]` = is cell (row r, col c) covered. Rows may be shorter than `rows` if empty. */
  occupancy: boolean[][];
};

/**
 * Place `spans` in a `cols`-wide grid — a faithful-enough port of CSS Grid auto-placement, so the
 * caller can stretch exactly the occupied rows *and* reason about dead cells. Mirrors
 * `grid-auto-flow: row` (`isPacked=false`, sparse cursor that never moves backward) and `row dense`
 * (`isPacked=true`, first-fit from the top). This is the single source of truth for placement —
 * `packedRowCount` and the dead-zone analyzer both build on it.
 */
export const placeSpans = (spans: Span[], cols: number, isPacked: boolean): Placed => {
  const occupancy: boolean[][] = [];
  const row = (r: number): boolean[] => {
    while (occupancy.length <= r) occupancy.push(new Array(cols).fill(false));
    return occupancy[r];
  };
  const fits = (r: number, c: number, cs: number, rs: number): boolean => {
    for (let i = r; i < r + rs; i++) for (let j = c; j < c + cs; j++) if (row(i)[j]) return false;
    return true;
  };

  const placements: Placement[] = [];
  let cursorR = 0;
  let cursorC = 0;
  let maxRow = 0;

  for (const { colSpan, rowSpan } of spans) {
    const cs = Math.min(colSpan, cols);
    const rs = rowSpan;
    let r = isPacked ? 0 : cursorR;
    let c = isPacked ? 0 : cursorC;

    while (c > cols - cs || !fits(r, c, cs, rs)) {
      c++;
      if (c > cols - cs) {
        r++;
        c = 0;
      }
    }

    for (let i = r; i < r + rs; i++) for (let j = c; j < c + cs; j++) row(i)[j] = true;
    placements.push({ colStart: c, rowStart: r, colSpan: cs, rowSpan: rs });
    maxRow = Math.max(maxRow, r + rs);
    if (!isPacked) {
      cursorR = r;
      cursorC = c + cs;
    }
  }

  return { placements, rows: Math.max(1, maxRow), occupancy };
};

/** Rows the given spans occupy in a `cols`-wide grid (>= 1). Thin wrapper over {@link placeSpans}. */
export const packedRowCount = (spans: Span[], cols: number, isPacked: boolean): number =>
  placeSpans(spans, cols, isPacked).rows;

/** An item is *elastic* when its size comes only from `weight` (no explicit `cols`/`rows`) — it may
 * grow to absorb dead cells. Items with an explicit span, or `isEmpty` negative space, are fixed. */
export const isElasticItem = (props: GridItemProps): boolean =>
  !props.isEmpty && props.cols == null && props.rows == null;

/**
 * Grow elastic items into adjacent dead cells so the span grid fills its width without reordering —
 * the "dead-zone-aware" pass on top of {@link placeSpans}. Each elastic item expands (right first,
 * then left) into columns that are empty across every row it spans; fixed items keep their span.
 * Returns a fresh placement array, same length/order as the input. Deterministic.
 */
export const fillDeadZones = (
  placements: Placement[],
  isElastic: boolean[],
  cols: number,
  rows: number,
): Placement[] => {
  const out = placements.map((p) => ({ ...p }));
  const occ: boolean[][] = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
  const paint = (p: Placement, c: number) => {
    for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++) if (occ[r]) occ[r][c] = true;
  };
  for (const p of out) for (let c = p.colStart; c < p.colStart + p.colSpan; c++) paint(p, c);

  // A column is growable for `p` only if it's in-bounds and free across all of p's rows.
  const colFree = (p: Placement, c: number): boolean => {
    if (c < 0 || c >= cols) return false;
    for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++) if (!occ[r] || occ[r][c]) return false;
    return true;
  };

  // Fixpoint: one item growing can open a gap adjacent to another. Bounded by total cells.
  let changed = true;
  while (changed) {
    changed = false;
    for (let i = 0; i < out.length; i++) {
      if (!isElastic[i]) continue;
      const p = out[i];
      while (colFree(p, p.colStart + p.colSpan)) {
        paint(p, p.colStart + p.colSpan);
        p.colSpan++;
        changed = true;
      }
      while (colFree(p, p.colStart - 1)) {
        p.colStart--;
        p.colSpan++;
        paint(p, p.colStart);
        changed = true;
      }
    }
  }
  return out;
};
