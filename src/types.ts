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

export type GridOptions = {
  cols?: number;
  rows?: number;
  /** Keep input order instead of sorting descending by weight. Preserves each item's position (so
   * you control layout) at the cost of slightly less-square aspect ratios — items whose weight is
   * far from their neighbours' can stretch. Default `false`. */
  preserveOrder?: boolean;
};
