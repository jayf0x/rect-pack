import type { CSSProperties, PropsWithChildren, ReactNode } from 'react';

export type GridInput = {
  /** Stable identifier echoed back on the placement. */
  id: string | number;
  /** Relative area. Defaults to 1. A 2 gets ~twice the area of a 1. */
  weight?: number;
};

export type GridPlacement = {
  id: string | number;
  /** Fractions of the unit square (0..1); guaranteed to tile it exactly. */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type GridPackOptions = {
  cols?: number;
  rows?: number;
};

/**
 * Component props
 **/

export type GridItemProps = PropsWithChildren<{
  /** Relative area. Defaults to 1; a 2 gets ~twice the space of a 1. Ignored on any axis pinned
   * by `cols`/`rows`. */
  weight?: number;
  /** Pin this item to exactly `cols` grid columns. Giving *any* item a `cols`/`rows` switches
   * the whole `<Grid>` to native CSS Grid (`grid-auto-flow: dense`). */
  cols?: number;
  /** Pin this item to exactly `rows` grid rows. See `cols`. */
  rows?: number;
}>;

/** Marker component — `Grid` reads its props and renders its children in the assigned block. */
export const GridItem = (_: GridItemProps): null => null;

export interface GridProps extends PropsWithChildren {
  cols?: number;
  rows?: number;
  gap?: number | string;
  /** `true` (default): stretch to fill the container's height. `false`: fixed `rowHeight` per
   * row, container grows downward. */
  fill?: boolean;
  /** Row height when `fill` is false. Ignored while filling. */
  rowHeight?: number | string;
  /** Smoothly transition position/size when weights or items change. Defaults to `true`, but
   * `false` under `prefers-reduced-motion` unless set explicitly. `undefined` means "auto" —
   * distinct from `false`, which forces animation off. */
  animate?: boolean;
  showGrid?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** `GridProps` with every default resolved, minus `children` (consumed separately as `items`).
 * `animate` stays optional — its `undefined` state ("follow prefers-reduced-motion") is
 * meaningful and distinct from `false`. */
export type ResolvedGridProps = Required<Omit<GridProps, 'children' | 'style' | 'animate'>> & {
  animate?: boolean;
  style?: CSSProperties;
};

export interface FreeGridProps extends ResolvedGridProps {
  items: React.ReactElement<GridItemProps>[];
}

export interface PinnedGridProps extends Omit<ResolvedGridProps, 'animate'> {
  items: React.ReactElement<GridItemProps>[];
}

export type ItemsProps = { children?: ReactNode };
