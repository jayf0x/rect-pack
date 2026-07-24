/**
 * `@weighted-grid/react` — a weighted CSS-Grid: items sized by `weight` (or exact `cols`/`rows`
 * spans), laid out in strict source order, with a `fill` strategy deciding how leftover cells are
 * handled. One engine, one switch (`fill`). `react` is a peer dependency, not bundled.
 */
import {
  memo,
  type CSSProperties,
  type PropsWithChildren,
  type ReactElement,
  type ReactNode,
} from "react";
import {
  toCss,
  spanFor,
  packedRowCount,
  placeSpans,
  fillDeadZones,
  isElasticItem,
  asGridItems,
} from "./utils";

/** How leftover cells are resolved after placement:
 * - `"none"` — raw spans; gaps stay.
 * - `"stretch"` (default) — grow non-strict (weight-only) items fairly into gaps, capped by `stretch`.
 * - `"component"` — leave items as-is; render `renderEmpty` in every empty cell.
 * - `"both"` — stretch first, then render `renderEmpty` in whatever cells stretch couldn't reach. */
export type FillMode = "none" | "stretch" | "component" | "both";

export type GridItemProps = PropsWithChildren<{
  /** Relative size, flexbox-`flex`-style ("how much of the grid do I get"). Fills whichever axis you
   * don't pin with `cols`/`rows`; pin neither and it drives both (`weight={2}` → a 2×2 block, so
   * equal weights are equal squares). Defaults to 1. */
  weight?: number;
  /** Exact column span. Pins the horizontal axis (then `weight` only drives rows). Clamped to `cols`.
   * An item with an explicit `cols` **or** `rows` is *strict* — it never stretches to fill gaps. */
  cols?: number;
  /** Exact row span. Pins the vertical axis (then `weight` only drives columns). Strict, see `cols`. */
  rows?: number;
}>;

export type GridProps = PropsWithChildren<{
  /** Number of columns. Always fills the container width. */
  cols?: number;
  /** Number of row tracks. Omit it (default) and the grid auto-counts the rows its items occupy, then
   * stretches exactly that many to fill the height. Set it to force a fixed track count. */
  rows?: number;
  gap?: number | string;
  /** `"fill"` (default): stretch to the parent's height, splitting it into `rows` bands — the parent
   * must have a height. A number/string (e.g. `80`, `"5rem"`): fixed height per row, grid grows down. */
  height?: "fill" | number | string;
  /** How leftover cells are handled. See {@link FillMode}. Defaults to `"stretch"`. */
  fill?: FillMode;
  /** For `fill="stretch"`/`"both"`: how many extra cells a weight-only item may gain **per axis**.
   * `0` disables growth; `Infinity` fills as far as possible. Defaults to `2`. */
  stretch?: number;
  /** For `fill="component"`/`"both"`: the node rendered in each empty cell. You own it — no default. */
  renderEmpty?: ReactNode;
  /** Debug overlay: faint column + row guide lines. */
  isGridVisible?: boolean;
  className?: string;
  style?: CSSProperties;
}>;

type SpanGridProps = Required<
  Omit<GridProps, "children" | "style" | "rows" | "renderEmpty">
> & {
  items: ReactElement<GridItemProps>[];
  rows?: number;
  renderEmpty?: ReactNode;
  style?: CSSProperties;
};

/** Marker component — `Grid` reads its props and renders its children in the assigned block. */
export const GridItem = (_: GridItemProps): null => null;

const gridLinesStyle = (cols: number, rows: number): CSSProperties => ({
  backgroundImage:
    "linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)," +
    "linear-gradient(rgba(255,255,255,.06) 1px, transparent 0)",
  backgroundSize: `calc(100% / ${cols}) calc(100% / ${rows})`,
});

const SpanGrid = ({
  items,
  cols,
  rows,
  gap,
  height,
  fill,
  stretch,
  renderEmpty,
  isGridVisible,
  className,
  style,
}: SpanGridProps) => {
  const gridSpan = items.map((item) => spanFor(item.props, cols));
  const track = height === "fill" ? "minmax(0, 1fr)" : toCss(height);
  // Auto-count the rows the flow occupies so `1fr` tracks stretch to fill the height; an explicit
  // `rows` forces a fixed count instead.
  const rowCount = rows ?? packedRowCount(gridSpan, cols, false);

  // Own placement (strict source order), then optionally grow weight-only items into dead cells.
  const base = placeSpans(gridSpan, cols, false).placements;
  const placed =
    fill === "stretch" || fill === "both"
      ? fillDeadZones(
          base,
          items.map((it) => isElasticItem(it.props)),
          cols,
          rowCount,
          stretch,
        )
      : base;

  // For component/both: find cells no item covers and render `renderEmpty` there. One node per cell
  // (ponytail: no region merging — predictable, and the caller controls what a single empty cell looks
  // like; merge only if a real design needs it).
  const emptyCells: Array<{ r: number; c: number }> = [];
  if ((fill === "component" || fill === "both") && renderEmpty != null) {
    const occ = Array.from({ length: rowCount }, () => new Array<boolean>(cols).fill(false));
    for (const p of placed)
      for (let r = p.rowStart; r < p.rowStart + p.rowSpan; r++)
        for (let c = p.colStart; c < p.colStart + p.colSpan; c++) if (occ[r]) occ[r][c] = true;
    for (let r = 0; r < rowCount; r++)
      for (let c = 0; c < cols; c++) if (!occ[r][c]) emptyCells.push({ r, c });
  }

  const containerStyles: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rowCount}, ${track})`,
    gridAutoRows: track,
    gap: toCss(gap),
    ...(height === "fill" ? { height: "100%" } : {}),
    ...(isGridVisible ? gridLinesStyle(cols, rowCount) : {}),
    ...style,
  };

  return (
    <div className={className} style={containerStyles} role="grid">
      {items.map((item, i) => {
        const p = placed[i];
        return (
          <div
            key={item.key ?? i}
            role="gridcell"
            tabIndex={0}
            style={{
              minWidth: 0,
              minHeight: 0,
              // 0-indexed model → 1-indexed CSS lines.
              gridColumn: `${p.colStart + 1} / span ${p.colSpan}`,
              gridRow: `${p.rowStart + 1} / span ${p.rowSpan}`,
            }}
          >
            {item.props.children}
          </div>
        );
      })}
      {emptyCells.map(({ r, c }) => (
        <div
          key={`empty-${r}-${c}`}
          aria-hidden
          style={{ gridColumn: `${c + 1} / span 1`, gridRow: `${r + 1} / span 1` }}
        >
          {renderEmpty}
        </div>
      ))}
    </div>
  );
};

export const Grid = memo((props: GridProps) => {
  const {
    children,
    cols = 7,
    rows,
    gap = 8,
    height = "fill",
    fill = "stretch",
    stretch = 2,
    renderEmpty,
    isGridVisible = false,
    className = "",
    style,
  } = props;

  const items = asGridItems(children);
  return (
    <SpanGrid
      items={items}
      cols={cols}
      rows={rows}
      gap={gap}
      height={height}
      fill={fill}
      stretch={stretch}
      renderEmpty={renderEmpty}
      isGridVisible={isGridVisible}
      className={className}
      style={style}
    />
  );
});
