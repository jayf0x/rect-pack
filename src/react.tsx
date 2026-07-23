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
import {
  useReducedMotion,
  toCss,
  spanFor,
  asGridItems,
  mergeDefaults,
} from "./utils";

export type GridItemProps = PropsWithChildren<{
  /** Default size for *both* axes: `weight={2}` is a 2×2 block, so equal weights are equal
   * squares. `cols`/`rows` override it per-axis. Defaults to 1. In `isTreemap` mode this is
   * relative area instead (see {@link GridProps.isTreemap}). */
  weight?: number;
  /** Exact column span (overrides `weight` on the horizontal axis). Clamped to the grid's `cols`. */
  cols?: number;
  /** Exact row span (overrides `weight` on the vertical axis). */
  rows?: number;
  /** Reserve the item's span as deliberate negative space — no border, no focus, no children. */
  isEmpty?: boolean;
}>;

export interface GridProps extends PropsWithChildren {
  cols?: number;
  rows?: number;
  gap?: number | string;
  /** Fill gaps left by odd spans by pulling later items back (`grid-auto-flow: dense`). Default
   * `true` — forgiving. Set `false` to keep strict source order at the cost of possible gaps. */
  isPacked?: boolean;
  /** Use the squarified treemap engine instead of the span grid: `weight` becomes relative *area*,
   * spans are ignored, and the container is filled exactly with no gaps. Default `false`. */
  isTreemap?: boolean;
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

export interface SpanGridProps extends Omit<ResolvedGridProps, "isAnimated"> {
  items: ReactElement<GridItemProps>[];
}

/** Marker component — `Grid` reads its props and renders its children in the assigned block. */
export const GridItem = (_: GridItemProps): null => null;

const DEFAULTS: Omit<ResolvedGridProps, "isAnimated" | "style"> = {
  cols: 7,
  rows: 7,
  gap: 8,
  isPacked: true,
  isTreemap: false,
  isFillHeight: true,
  rowHeight: 96,
  isGridVisible: false,
  className: "",
};

const gridLinesStyle = (cols: number): CSSProperties => ({
  backgroundImage:
    "linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)",
  backgroundSize: `calc(100% / ${cols}) 100%`,
});

/** Shared cell shell for both layout modes — the parent sets only its positioning style. An empty
 * cell reserves its span but is inert: no gridcell role, no focus, no content. */
const Cell = ({
  style,
  isEmpty,
  children,
}: PropsWithChildren<{ style: CSSProperties; isEmpty?: boolean }>) =>
  isEmpty ? (
    <div aria-hidden style={{ ...style }} />
  ) : (
    <div
      role="gridcell"
      tabIndex={0}
      style={{ minWidth: 0, minHeight: 0, ...style }}
    >
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
          isEmpty={items[i].props.isEmpty}
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

/** Span mode (default): every item takes an exact col/row span (from `weight`/`cols`/`rows`) and
 * native CSS Grid places them. `isPacked` picks the flow: `dense` back-fills gaps (forgiving, but
 * later items can jump earlier), plain `row` keeps strict source order. `cols` columns always fill
 * the width via `minmax(0, 1fr)`; `rows` sets the height-filling row bands when `isFillHeight`. */
const SpanGrid = ({
  items,
  cols,
  rows,
  gap,
  isPacked,
  isFillHeight,
  rowHeight,
  isGridVisible,
  className,
  style,
}: SpanGridProps) => {
  const gridSpan = items.map((item) => spanFor(item.props, cols));

  const containerStyles: CSSProperties = {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gridAutoFlow: isPacked ? "row dense" : "row",
    gap: toCss(gap),
    ...(isFillHeight
      ? {
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
          gridAutoRows: "minmax(0, 1fr)",
          height: "100%",
        }
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
            isEmpty={item.props.isEmpty}
            style={{
              gridColumn: `span ${colSpan}`,
              gridRow: `span ${rowSpan}`,
            }}
          >
            {item.props.children}
          </Cell>
        );
      })}
    </div>
  );
};

export const Grid = memo(({ children, ...rest }: GridProps) => {
  const args = mergeDefaults(rest, DEFAULTS) as ResolvedGridProps;

  const items = asGridItems(children);

  return args.isTreemap ? (
    <FreeGrid items={items} {...args} />
  ) : (
    <SpanGrid items={items} {...args} />
  );
});
