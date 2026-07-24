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

/** Analyze the same items *after* the order-mode dead-zone fill — what `<Grid mode="order">` renders.
 * `maxStretch` matches the `stretch` prop (extra cells per axis an elastic item may grow). */
export const analyzeItemsFilled = (
  items: GridItemProps[],
  cols: number,
  maxStretch = Number.POSITIVE_INFINITY,
): DeadZoneReport => {
  const { placements, rows } = placeSpans(items.map((p) => spanFor(p, cols)), cols, false);
  const filled = fillDeadZones(placements, items.map(isElasticItem), cols, rows, maxStretch);
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
// Live Showcase config — a *verbatim* copy of the desktop grid in
// ../jayf0x.github.io/src/pages/Home/Showcase/index.tsx (`weightForIndex` + `emptyTiles`), so this
// harness and the real page lay out identically. Every content item is weight-only (elastic); the
// three `emptyTiles` are fixed `isEmpty` VoidTiles (intentional negative space). Keep in sync.
// ─────────────────────────────────────────────────────────────────────────────
const weightForIndex = (i: number): number => {
  if (i === 0) return 3;
  const x = Math.sin(i * 12.9898) * 43758.5453;
  const r = x - Math.floor(x);
  if (r < 0.15) return 3;
  if (r < 0.55) return 2;
  return 4;
};

const emptyTiles = [
  { at: 3, cols: 2, rows: 2 },
  { at: 6, cols: 1, rows: 2 },
  { at: 10, cols: 2, rows: 1 },
];

/** The exact item stream the desktop Showcase renders (repos + woven-in VoidTiles, in order). */
export const showcaseItems = (count = 12): GridItemProps[] => {
  const items: GridItemProps[] = [];
  for (let i = 0; i < count; i++) {
    const empty = emptyTiles.find((e) => e.at === i);
    if (empty) items.push({ cols: empty.cols, rows: empty.rows, isEmpty: true });
    items.push({ weight: weightForIndex(i) });
  }
  return items;
};

if (import.meta.main) {
  const colsArg = process.argv.find((a) => a.startsWith('--cols='));
  const cols = colsArg ? Number(colsArg.split('=')[1]) : 12;
  const items = showcaseItems();

  console.log(formatReport(analyzeItems(items, cols), `Showcase order-mode (raw)`));
  for (const cap of [1, 2, Number.POSITIVE_INFINITY]) {
    console.log();
    console.log(formatReport(analyzeItemsFilled(items, cols, cap), `order-mode fill (stretch=${cap})`));
  }
}
