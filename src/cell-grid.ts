import { log } from './log';
import type { Rectangle } from './types';

/**
 * A packing surface modeled as a grid of columns, each holding a linked list of cells stacked
 * top to bottom. A cell is "occupied" once a rectangle has claimed it. Columns and cells are
 * split as needed so every placed rectangle maps to a contiguous run of whole cells.
 */
type Cell = {
  height: number;
  occupied: number;
  nextCell: Cell | null;
};

type Col = {
  width: number;
  cell: Cell | null;
  nextCol: Col | null;
};

export type Placing = {
  enclosingWidth: number;
  enclosingHeight: number;
  cols: Col | null;
};

type Range = {
  startIndex: number;
  endIndex: number;
  overshoot: number;
};

type Region = {
  colRange: Range;
  cellRange: Range;
};

export const createPlacing = (enclosingWidth: number, enclosingHeight: number): Placing => ({
  enclosingWidth,
  enclosingHeight,
  cols: {
    width: enclosingWidth,
    nextCol: null,
    cell: { height: enclosingHeight, occupied: 0, nextCell: null },
  },
});

const stepOffset = (base: Cell | null, offset: number): Cell | null => {
  let cell = base;
  for (let i = 0; i < offset && cell !== null; i++) cell = cell.nextCell;
  return cell;
};

/** Finds the longest run of unoccupied cells in `col` whose combined height covers `height`. */
const tryFitHeightInCol = (col: Col, height: number, cellRange: Range): boolean => {
  let sumHeight = 0;
  cellRange.startIndex = 0;

  for (let cell = col.cell, i = 0; cell !== null; cell = cell.nextCell, i++) {
    if (cell.occupied) {
      sumHeight = 0;
      cellRange.startIndex = i + 1;
      continue;
    }

    if (sumHeight + cell.height >= height) {
      cellRange.endIndex = i;
      cellRange.overshoot = height - sumHeight;
      return true;
    }
    sumHeight += cell.height;
  }

  return false;
};

/** Finds the first region wide and tall enough to hold `rectangle`, scanning columns left to right. */
const findRegion = (placing: Placing, rectangle: { width: number; height: number }, region: Region): boolean => {
  for (let col = placing.cols, i = 0; col !== null; col = col.nextCol, i++) {
    const colRange: Range = { startIndex: i, endIndex: i, overshoot: 0 };
    const cellRange: Range = { startIndex: 0, endIndex: 0, overshoot: 0 };

    if (!tryFitHeightInCol(col, rectangle.height, cellRange)) continue;

    let sumWidth = 0;
    let fitsAcrossColumns = true;

    for (let candidate: Col | null = col; candidate !== null; candidate = candidate.nextCol) {
      const cell = stepOffset(candidate.cell, cellRange.startIndex);
      if (cell?.occupied) {
        fitsAcrossColumns = false;
        break;
      }

      if (sumWidth + candidate.width >= rectangle.width) {
        colRange.overshoot = rectangle.width - sumWidth;
        region.colRange = colRange;
        region.cellRange = cellRange;
        return true;
      }

      sumWidth += candidate.width;
      colRange.endIndex++;
    }

    if (!fitsAcrossColumns) continue;
  }

  return false;
};

/** Splits the column/cell boundaries at `region`'s edges so the region maps to whole cells. */
const splitRegionBoundaries = (placing: Placing, region: Region): boolean => {
  let colToSplit: Col | null = null;

  for (let col = placing.cols, i = 0; col !== null; col = col.nextCol, i++) {
    if (region.cellRange.overshoot > 0) {
      const cell = stepOffset(col.cell, region.cellRange.endIndex);
      if (cell !== null) {
        cell.nextCell = { height: cell.height - region.cellRange.overshoot, occupied: cell.occupied, nextCell: cell.nextCell };
        cell.height = region.cellRange.overshoot;
      }
    }
    if (i === region.colRange.endIndex) colToSplit = col;
  }

  if (region.colRange.overshoot > 0) {
    if (colToSplit === null) {
      log('Failed to find column to split.');
      return false;
    }

    const newCol: Col = { width: colToSplit.width - region.colRange.overshoot, nextCol: colToSplit.nextCol, cell: null };
    let tail: Cell | null = null;
    for (let cell = colToSplit.cell; cell !== null; cell = cell.nextCell) {
      const copy: Cell = { height: cell.height, occupied: cell.occupied, nextCell: null };
      if (tail === null) newCol.cell = copy;
      else tail.nextCell = copy;
      tail = copy;
    }

    colToSplit.width = region.colRange.overshoot;
    colToSplit.nextCol = newCol;
  }

  return true;
};

/** Marks every cell in `region` as occupied by `rectangle` and records its top-left placement. */
const claimRegion = (placing: Placing, rectangle: Rectangle & { __id: number }, region: Region): void => {
  let x = 0;
  let placed = false;

  for (let col = placing.cols, i = 0; col !== null && i <= region.colRange.endIndex; col = col.nextCol, i++) {
    if (i >= region.colRange.startIndex) {
      let y = 0;
      for (let cell = col.cell, k = 0; cell !== null && k <= region.cellRange.endIndex; cell = cell.nextCell, k++) {
        if (k >= region.cellRange.startIndex) {
          cell.occupied = rectangle.__id ?? 0;
          if (!placed) {
            rectangle.x = x;
            rectangle.y = y;
            placed = true;
          }
        }
        y += cell.height;
      }
    }
    x += col.width;
  }
};

/** Finds space for `rectangle` in `placing`, splits the grid to fit, and claims it. */
export const addRectangle = (placing: Placing, rectangle: Rectangle & { __id: number }): boolean => {
  const region: Region = {
    colRange: { startIndex: 0, endIndex: 0, overshoot: 0 },
    cellRange: { startIndex: 0, endIndex: 0, overshoot: 0 },
  };

  if (!findRegion(placing, rectangle, region)) return false;
  if (!splitRegionBoundaries(placing, region)) return false;

  claimRegion(placing, rectangle, region);
  return true;
};

/** Attempts to place every rectangle in `list` into a grid of the given enclosing size. */
export const placeAll = (
  list: (Rectangle & { __id: number })[],
  enclosingWidth: number,
  enclosingHeight: number,
): boolean => {
  const placing = createPlacing(enclosingWidth, enclosingHeight);

  for (const rectangle of list) {
    if (!addRectangle(placing, rectangle)) return false;
  }

  return true;
};
