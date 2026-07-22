/** A width/height pair, without position. */
export type RectSize = {
  width: number;
  height: number;
};

/** A positioned, sized rectangle. */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A rectangle to be packed; x/y are filled in once placed. */
export type Rectangle = {
  width: number;
  height: number;
  x?: number;
  y?: number;
};

export type RectangleSize = {
  width: number;
  height: number;
};

/** Heuristics for choosing which free rectangle to place the next piece into. */
export const FreeRectChoiceHeuristic = {
  BestAreaFit: 'BestAreaFit',
  BestShortSideFit: 'BestShortSideFit',
  BestLongSideFit: 'BestLongSideFit',
  WorstAreaFit: 'WorstAreaFit',
  WorstShortSideFit: 'WorstShortSideFit',
  WorstLongSideFit: 'WorstLongSideFit',
} as const;

export type FreeRectChoiceHeuristic = (typeof FreeRectChoiceHeuristic)[keyof typeof FreeRectChoiceHeuristic];

/** Heuristics for choosing which axis to split leftover free space along. */
export const GuillotineSplitHeuristic = {
  ShorterLeftoverAxis: 'ShorterLeftoverAxis',
  LongerLeftoverAxis: 'LongerLeftoverAxis',
  MinimizeArea: 'MinimizeArea',
  MaximizeArea: 'MaximizeArea',
  ShorterAxis: 'ShorterAxis',
  LongerAxis: 'LongerAxis',
} as const;

export type GuillotineSplitHeuristic = (typeof GuillotineSplitHeuristic)[keyof typeof GuillotineSplitHeuristic];
