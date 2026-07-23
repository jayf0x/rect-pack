/**
 * `@weighted-grid/react` — thin React wrapper over {@link ./core}.
 *
 * One `mode` prop picks the engine, one `height` prop picks the vertical behaviour. Nothing else
 * toggles layout — no stack of interacting booleans. `react` is a peer dependency, not bundled.
 */
import {
  memo,
  useMemo,
  type CSSProperties,
  type PropsWithChildren,
  type ReactElement,
} from "react";
import { neededRows, layoutGrid } from "./core";
import { useReducedMotion, toCss, spanFor, asGridItems } from "./utils";

export type GridMode = "pack" | "order" | "treemap";

export type GridItemProps = PropsWithChildren<{
  /** Default size for *both* axes: `weight={2}` is a 2×2 block, so equal weights are equal
   * squares. `cols`/`rows` override it per-axis. Defaults to 1. In `mode="treemap"` `weight` is
   * relative *area* instead, and `cols`/`rows` here are ignored (the treemap has no fixed cells). */
  weight?: number;
  /** Exact column span (overrides `weight` horizontally). Clamped to the grid's `cols`. Ignored in
   * `mode="treemap"`. */
  cols?: number;
  /** Exact row span (overrides `weight` vertically). Ignored in `mode="treemap"`. */
  rows?: number;
  /** Reserve the item's span as deliberate negative space — no border, no focus, no children. */
  isEmpty?: boolean;
}>;

type CommonGridProps = PropsWithChildren<{
  /** Number of columns. Always fills the container width (there is no width equivalent of
   * `height` — a grid stretches horizontally by definition). */
  cols?: number;
  /** Number of rows. With `height="fill"` these bands split the container height; with a fixed
   * `height` they are the minimum rows drawn before the grid flows onward. */
  rows?: number;
  gap?: number | string;
  /** `"fill"` (default): stretch to the parent's height, splitting it into `rows` bands — the
   * parent must have a height. A number/string (e.g. `80`, `"5rem"`): fixed height per row, and
   * the container grows downward to fit. */
  height?: "fill" | number | string;
  /** Debug overlay: faint column + row guide lines. */
  isGridVisible?: boolean;
  className?: string;
  style?: CSSProperties;
}>;

/**
 * `mode` is the single layout switch:
 * - `"pack"` (default) — exact col/row spans, gaps back-filled by later items (`grid-auto-flow:
 *   dense`). Forgiving; item order can shift to fill holes.
 * - `"order"` — exact spans, strict source order, gaps left as-is.
 * - `"treemap"` — the squarified allocator: `weight` is area, the container is filled exactly with
 *   no gaps, and items are re-sorted by weight. Adds `isAnimated` (invalid in the other modes).
 */
export type GridProps =
  | (CommonGridProps & { mode?: "pack" | "order" })
  | (CommonGridProps & {
      mode: "treemap";
      /** Treemap only: smoothly transition boxes when weights/items change. Defaults to `true`,
       * but `false` under `prefers-reduced-motion` unless set explicitly. */
      isAnimated?: boolean;
    });

type SpanGridProps = Required<Omit<CommonGridProps, "children" | "style">> & {
  items: ReactElement<GridItemProps>[];
  isPacked: boolean;
  style?: CSSProperties;
};

type TreemapGridProps = Required<Omit<CommonGridProps, "children" | "style">> & {
  items: ReactElement<GridItemProps>[];
  isAnimated?: boolean;
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

/** Shared cell shell for both layout modes. An empty cell reserves its span but is inert: no
 * gridcell role, no focus, no content. */
const Cell = ({
  style,
  isEmpty,
  children,
}: PropsWithChildren<{ style: CSSProperties; isEmpty?: boolean }>) =>
  isEmpty ? (
    <div aria-hidden style={style} />
  ) : (
    <div role="gridcell" tabIndex={0} style={{ minWidth: 0, minHeight: 0, ...style }}>
      {children}
    </div>
  );

/** Span modes (`pack`/`order`): each item takes an exact col/row span, native CSS Grid places it. */
const SpanGrid = ({
  items,
  cols,
  rows,
  gap,
  height,
  isPacked,
  isGridVisible,
  className,
  style,
}: SpanGridProps) => {
  const gridSpan = items.map((item) => spanFor(item.props, cols));
  const track = height === "fill" ? "minmax(0, 1fr)" : toCss(height);

  const containerStyles: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridTemplateRows: `repeat(${rows}, ${track})`,
    gridAutoRows: track,
    gridAutoFlow: isPacked ? "row dense" : "row",
    gap: toCss(gap),
    ...(height === "fill" ? { height: "100%" } : {}),
    ...(isGridVisible ? gridLinesStyle(cols, rows) : {}),
    ...style,
  };

  return (
    <div className={className} style={containerStyles} role="grid">
      {items.map((item, i) => {
        const { colSpan, rowSpan } = gridSpan[i];
        return (
          <Cell
            key={item.key ?? i}
            isEmpty={item.props.isEmpty}
            style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
          >
            {item.props.children}
          </Cell>
        );
      })}
    </div>
  );
};

/** Treemap mode: items placed by the squarified allocator, absolutely positioned as percentages. */
const TreemapGrid = ({
  items,
  cols,
  rows,
  gap,
  height,
  isAnimated,
  isGridVisible,
  className,
  style,
}: TreemapGridProps) => {
  const weights = items.map((c) =>
    typeof c.props.weight === "number" && c.props.weight > 0 ? c.props.weight : 1,
  );

  const placements = useMemo(
    () => layoutGrid(weights.map((weight, id) => ({ id, weight })), { cols, rows }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weights.join(","), cols, rows],
  );

  const isReducedMotion = useReducedMotion();

  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height:
      height === "fill"
        ? "100%"
        : `calc(${toCss(height)} * ${neededRows(items.length, cols, rows)})`,
    ...(isGridVisible ? gridLinesStyle(cols, rows) : {}),
    ...style,
  };

  const transition: CSSProperties["transition"] = (isAnimated ?? !isReducedMotion)
    ? "left 260ms ease, top 260ms ease, width 260ms ease, height 260ms ease"
    : undefined;

  return (
    <div className={className} style={containerStyle} role="grid">
      {placements.map((p, i) => (
        <Cell
          key={items[i].key ?? i}
          isEmpty={items[i].props.isEmpty}
          style={{
            position: "absolute",
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: `${p.w * 100}%`,
            height: `${p.h * 100}%`,
            transition,
            padding: `calc(${toCss(gap)} / 2)`,
            boxSizing: "border-box",
          }}
        >
          {items[i].props.children}
        </Cell>
      ))}
    </div>
  );
};

export const Grid = memo((props: GridProps) => {
  const {
    children,
    mode = "pack",
    cols = 7,
    rows = 7,
    gap = 8,
    height = "fill",
    isGridVisible = false,
    className = "",
    style,
  } = props;

  const items = asGridItems(children);
  const shared = { items, cols, rows, gap, height, isGridVisible, className, style };

  if (mode === "treemap") {
    const isAnimated = "isAnimated" in props ? props.isAnimated : undefined;
    return <TreemapGrid {...shared} isAnimated={isAnimated} />;
  }
  return <SpanGrid {...shared} isPacked={mode === "pack"} />;
});
