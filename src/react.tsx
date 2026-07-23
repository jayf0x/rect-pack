/**
 * `@weighted-grid/react` — thin React wrapper over {@link ./core}.
 *
 * The core computes fractional rects; the DOM does the rest via absolute-positioned percentages,
 * so `<Grid>` never re-packs on resize. `react` is a peer dependency, not bundled.
 */
import {
  memo,
  useMemo,
  type CSSProperties,
  type PropsWithChildren,
  type ReactElement,
} from "react";
import { neededRows, layoutGrid } from "./core";
import { useReducedMotion, toCss, spanFor, asValidElements, defined } from "./utils";

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
  isFillHeight?: boolean;
  /** Row height when `isFillHeight` is false. Ignored while filling. */
  rowHeight?: number | string;
  /** Smoothly transition position/size when weights or items change. Defaults to `true`, but
   * `false` under `prefers-reduced-motion` unless set explicitly. `undefined` means "auto" —
   * distinct from `false`, which forces animation off. */
  isAnimated?: boolean;
  isGridVisible?: boolean;
  className?: string;
  style?: CSSProperties;
}

/** `GridProps` with every default resolved, minus `children` (consumed separately as `items`).
 * `isAnimated` stays optional — its `undefined` state ("follow prefers-reduced-motion") is
 * meaningful and distinct from `false`. */
export type ResolvedGridProps = Required<
  Omit<GridProps, "children" | "style" | "isAnimated">
> & {
  isAnimated?: boolean;
  style?: CSSProperties;
};

export interface FreeGridProps extends ResolvedGridProps {
  items: ReactElement<GridItemProps>[];
}

export interface PinnedGridProps extends Omit<ResolvedGridProps, "isAnimated"> {
  items: ReactElement<GridItemProps>[];
}

const DEFAULTS: Omit<ResolvedGridProps, "isAnimated" | "style"> = {
  cols: 7,
  rows: 7,
  gap: 8,
  isFillHeight: true,
  rowHeight: 96,
  isGridVisible: false,
  className: "",
};

const gridLinesStyle = (cols: number): CSSProperties => ({
  backgroundImage: "linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)",
  backgroundSize: `calc(100% / ${cols}) 100%`,
});

/** Shared cell shell for both layout modes — the parent sets only its positioning style. */
const Cell = ({ style, children }: PropsWithChildren<{ style: CSSProperties }>) => (
  <div role="gridcell" tabIndex={0} style={{ minWidth: 0, minHeight: 0, ...style }}>
    {children}
  </div>
);

/** Free-fill mode: items placed by the squarified treemap, absolutely positioned as percentages. */
const FreeGrid = ({
  items,
  cols,
  rows,
  gap,
  isFillHeight,
  rowHeight,
  isAnimated,
  isGridVisible,
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
      layoutGrid(
        weights.map((weight, id) => ({ id, weight })),
        { cols, rows },
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weights.join(","), cols, rows],
  );

  const isReducedMotion = useReducedMotion();

  const containerStyle: CSSProperties = {
    position: "relative",
    width: "100%",
    height: isFillHeight
      ? "100%"
      : `calc(${toCss(rowHeight)} * ${neededRows(items.length, cols, rows)})`,
    ...(isGridVisible ? gridLinesStyle(cols) : {}),
    ...style,
  };

  const transitionStyle: CSSProperties["transition"] =
    (isAnimated ?? !isReducedMotion)
      ? "left 260ms ease, top 260ms ease, width 260ms ease, height 260ms ease"
      : undefined;

  return (
    <div className={className} style={containerStyle} role="grid">
      {placements.map((p, i) => (
        <Cell
          key={items[i].key ?? i}
          style={{
            position: "absolute",
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: `${p.w * 100}%`,
            height: `${p.h * 100}%`,
            transition: transitionStyle,
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

/** Pinned-span mode: at least one item wants an exact col/row span, so hand placement to native
 * CSS Grid (`grid-auto-flow: dense`) — packing fixed spans around flexible ones is a bin-packing
 * problem the browser already solves. Trade-off: `dense` can reorder items to fill gaps, and grid
 * track changes don't support the transition `FreeGrid` uses. */
const PinnedGrid = ({
  items,
  cols,
  gap,
  isFillHeight,
  rowHeight,
  isGridVisible,
  className,
  style,
}: PinnedGridProps) => {
  const gridSpan = items.map((item) => spanFor(item.props, cols));

  const containerStyles: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gridAutoFlow: "row dense",
    gap: toCss(gap),
    ...(isFillHeight
      ? { gridAutoRows: "1fr", height: "100%" }
      : { gridAutoRows: toCss(rowHeight) }),
    ...(isGridVisible ? gridLinesStyle(cols) : {}),
    ...style,
  };

  return (
    <div className={className} style={containerStyles} role="grid">
      {items.map((item, i) => {
        const { colSpan, rowSpan } = gridSpan[i];
        return (
          <Cell
            key={item.key ?? i}
            style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}` }}
          >
            {item.props.children}
          </Cell>
        );
      })}
    </div>
  );
};

export const Grid = memo(({ children, ...rest }: GridProps) => {
  const args = { ...DEFAULTS, ...defined(rest) } as ResolvedGridProps;

  const items = asValidElements<GridItemProps>(children);
  const isPinned = items.some(
    (c) => c.props.cols != null || c.props.rows != null,
  );

  return isPinned ? (
    <PinnedGrid items={items} {...args} />
  ) : (
    <FreeGrid items={items} {...args} />
  );
});
