/**
 * Dead-zone analyzer / QA harness for the span grid.
 *
 * Runs against the placement *model* (`placeSpans`) rather than a real browser — no puppeteer, no
 * deps, deterministic, and importable straight into a test. Because the grid's plan is to move to
 * JS-owned explicit placement, this model equals what the DOM renders, so it's the right long-term
 * QA surface for "how much empty space is left?".
 *
 * Run:   bun scripts/dead-zones.ts            # analyzes the live Showcase config below
 *        bun scripts/dead-zones.ts --cols=8   # override the column count
 * Import: `analyzeSpans` / `formatReport` for unit tests (see tests/dead-zones.test.ts).
 */
import { placeSpans, spanFor, fillDeadZones, isElasticItem, type Placement, type Span } from '../src/utils';
import type { GridItemProps } from '../src/react';

export type DeadZoneReport = {
  cols: number;
  rows: number;
  total: number;
  dead: number;
  /** Percentage of grid cells left empty. */
  deadPct: number;
  /** Σ(dead per row)² — squared so one big hole scores worse than several small ones. */
  badness: number;
  perRow: { row: number; used: number; dead: number }[];
  /** ASCII occupancy map: `#` = filled, `.` = dead. */
  map: string;
};

/** Build a report from a resolved occupancy grid — shared by the raw and dead-zone-filled paths. */
const reportFromOccupancy = (occupancy: boolean[][], cols: number, rows: number): DeadZoneReport => {
  const perRow: DeadZoneReport['perRow'] = [];
  const mapLines: string[] = [];
  let dead = 0;
  let badness = 0;

  for (let r = 0; r < rows; r++) {
    const line = occupancy[r] ?? new Array(cols).fill(false);
    const used = line.reduce((s, b) => s + (b ? 1 : 0), 0);
    const d = cols - used;
    dead += d;
    badness += d * d;
    perRow.push({ row: r, used, dead: d });
    mapLines.push(line.map((b) => (b ? '#' : '.')).join(''));
  }

  const total = rows * cols;
  return {
    cols,
    rows,
    total,
    dead,
    deadPct: total ? (100 * dead) / total : 0,
    badness,
    perRow,
    map: mapLines.join('\n'),
  };
};

export const analyzeSpans = (spans: Span[], cols: number, isPacked = false): DeadZoneReport => {
  const { occupancy, rows } = placeSpans(spans, cols, isPacked);
  return reportFromOccupancy(occupancy, cols, rows);
};

/** Rebuild an occupancy grid from explicit placements (used to measure the post-fill layout). */
const occupancyOf = (placements: Placement[], cols: number, rows: number): boolean[][] => {
  const occ = Array.from({ length: rows }, () => new Array<boolean>(cols).fill(false));
  for (const p of placements)
    for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++)
      for (let c = p.colStart; c < p.colStart + p.colSpan; c++) if (occ[r]?.[c] === false) occ[r][c] = true;
  return occ;
};

/** Convenience: analyze a list of `<GridItem>`-style props (uses the real `spanFor`). */
export const analyzeItems = (items: GridItemProps[], cols: number, isPacked = false): DeadZoneReport =>
  analyzeSpans(items.map((p) => spanFor(p, cols)), cols, isPacked);

/** Analyze the same items *after* the order-mode dead-zone fill — what `<Grid mode="order">` renders. */
export const analyzeItemsFilled = (items: GridItemProps[], cols: number): DeadZoneReport => {
  const { placements, rows } = placeSpans(items.map((p) => spanFor(p, cols)), cols, false);
  const filled = fillDeadZones(placements, items.map(isElasticItem), cols, rows);
  return reportFromOccupancy(occupancyOf(filled, cols, rows), cols, rows);
};

export const formatReport = (report: DeadZoneReport, title = 'dead-zone report'): string => {
  const { cols, rows, dead, total, deadPct, badness, map } = report;
  return [
    `── ${title} (cols=${cols}) ──`,
    map,
    `rows=${rows}  dead=${dead}/${total} cells (${deadPct.toFixed(0)}% empty)  badness(Σdead²)=${badness}`,
  ].join('\n');
};

// ─────────────────────────────────────────────────────────────────────────────
// Live Showcase config — keep in sync with
// ../jayf0x.github.io/src/pages/Home/Showcase/index.tsx  (spanForIndex + emptyTiles).
// Editing the weights here is the fastest way to see their effect on dead space before touching the
// engine (the all-even widths are *why* column 12 dies — see .claude/next-agent-prompt.md).
// ─────────────────────────────────────────────────────────────────────────────
const spanForIndex = (i: number): GridItemProps =>
  i === 0 ? { weight: 3 } : i % 3 === 0 ? { cols: 2, rows: 1 } : { weight: 2 };

const emptyTiles = [
  { at: 3, cols: 2, rows: 2 },
  { at: 6, cols: 1, rows: 2 },
  { at: 10, cols: 2, rows: 1 },
];

/** The exact item stream the desktop Showcase renders (repos + woven-in empties, in order). */
export const showcaseItems = (count = 12): GridItemProps[] => {
  const items: GridItemProps[] = [];
  for (let i = 0; i < count; i++) {
    const empty = emptyTiles.find((e) => e.at === i);
    if (empty) items.push({ cols: empty.cols, rows: empty.rows });
    items.push(spanForIndex(i));
  }
  return items;
};

if (import.meta.main) {
  const colsArg = process.argv.find((a) => a.startsWith('--cols='));
  const cols = colsArg ? Number(colsArg.split('=')[1]) : 12;
  const items = showcaseItems();

  console.log(formatReport(analyzeItems(items, cols), `Showcase order-mode (raw)`));
  console.log();
  console.log(formatReport(analyzeItemsFilled(items, cols), `Showcase order-mode (dead-zone fill)`));
  if (!colsArg) {
    console.log();
    console.log(formatReport(analyzeItems(items, cols, true), `Showcase pack-mode (dense)`));
  }
}
