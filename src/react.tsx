/**
 * `@weighted-grid/react` — thin React wrapper over {@link ./grid-pack}.
 *
 * The core computes fractional rects; the DOM does the rest via absolute-positioned percentages,
 * so `<Grid>` never re-packs on resize. `react` is a peer dependency, not bundled.
 */
import {
  memo,
  useMemo,
  isValidElement,
  Children,
  type CSSProperties,
} from "react";
import { neededRows, packGrid } from "./core";
import type {
  FreeGridProps,
  GridItemProps,
  GridProps,
  ItemsProps,
  PinnedGridProps,
  ResolvedGridProps,
} from "./types";
import { useReducedMotion, toCss, spanFor } from "./utils";

const DEFAULTS: Omit<ResolvedGridProps, "animate" | "style"> = {
  cols: 7,
  rows: 7,
  gap: 8,
  fill: true,
  rowHeight: 96,
  showGrid: false,
  className: "",
};

const gridBackground = (cols: number): CSSProperties => ({
  backgroundImage:
    "linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)",
  backgroundSize: `calc(100% / ${cols}) 100%`,
});

const gridItems = ({
  children,
}: ItemsProps): React.ReactElement<GridItemProps>[] =>
  Children.toArray(children).filter(
    isValidElement,
  ) as React.ReactElement<GridItemProps>[];

/** Free-fill mode: items placed by the squarified treemap, absolutely positioned as percentages. */
const FreeGrid = ({
  items,
  cols,
  rows,
  gap,
  fill,
  rowHeight,
  animate,
  showGrid,
  className,
  style,
}: FreeGridProps) => {
  const weights = items.map((c) =>
    typeof c.props.weight === "number" && c.props.weight > 0
      ? c.props.weight
      : 1,
  );

  const placements = useMemo(
    () =>
      packGrid(
        weights.map((weight, id) => ({ id, weight })),
        { cols, rows },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weights.join(","), cols, rows],
  );

  const reducedMotion = useReducedMotion();

  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: fill
      ? "100%"
      : `calc(${toCss(rowHeight)} * ${neededRows(items.length, cols, rows)})`,
    ...(showGrid ? gridBackground(cols) : {}),
    ...style,
  };

  return (
    <div className={className} style={containerStyle} role="grid">
      {placements.map((p, i) => (
        <div
          key={p.id}
          role="gridcell"
          tabIndex={0}
          style={{
            position: "absolute",
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: `${p.w * 100}%`,
            height: `${p.h * 100}%`,
            transition:
              (animate ?? !reducedMotion)
                ? "left 260ms ease, top 260ms ease, width 260ms ease, height 260ms ease"
                : undefined,
            padding: `calc(${toCss(gap)} / 2)`,
            boxSizing: "border-box",
            minWidth: 0,
            minHeight: 0,
          }}
        >
          {items[i].props.children}
        </div>
      ))}
    </div>
  );
};

/** Pinned-span mode: at least one item wants an exact col/row span, so hand placement to native
 * CSS Grid (`grid-auto-flow: dense`) — packing fixed spans around flexible ones is a bin-packing
 * problem the browser already solves. Trade-off: `dense` can reorder items to fill gaps, and grid
 * track changes don't support the transition `FreeGrid` uses. */
const PinnedGrid = ({
  items,
  cols,
  gap,
  fill,
  rowHeight,
  showGrid,
  className,
  style,
}: PinnedGridProps) => {
  const spans = useMemo(
    () => items.map((item) => spanFor(item.props, cols)),
    [items, cols],
  );

  const gridStyle: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridAutoFlow: "row dense",
    gap: toCss(gap),
    ...(fill
      ? { gridAutoRows: "1fr", height: "100%" }
      : { gridAutoRows: toCss(rowHeight) }),
    ...(showGrid ? gridBackground(cols) : {}),
    ...style,
  };

  return (
    <div className={className} style={gridStyle} role="grid">
      {items.map((item, i) => {
        const { colSpan, rowSpan } = spans[i];
        return (
          <div
            key={i}
            role="gridcell"
            tabIndex={0}
            style={{
              gridColumn: `span ${colSpan}`,
              gridRow: `span ${rowSpan}`,
              minWidth: 0,
              minHeight: 0,
            }}
          >
            {item.props.children}
          </div>
        );
      })}
    </div>
  );
};

export const Grid = memo(({ children, animate, style, ...rest }: GridProps) => {
  const resolved: ResolvedGridProps = { ...DEFAULTS, ...rest, animate, style };
  const items = gridItems({ children });
  const pinned = items.some(
    (c) => c.props.cols != null || c.props.rows != null,
  );

  return pinned ? (
    <PinnedGrid items={items} {...resolved} />
  ) : (
    <FreeGrid items={items} {...resolved} />
  );
});
