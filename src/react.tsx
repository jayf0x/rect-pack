/**
 * `@weighted-grid/react` — thin React wrapper over {@link ./grid-pack}.
 *
 * The core computes fractional rects (a squarified treemap); the DOM does everything else via
 * absolute positioning in percentages, so the container fills exactly with no gaps regardless of
 * its actual pixel aspect. Sizing is driven purely by each item's `weight` (relative area) — there
 * are no pixel sizes, because a grid that resizes with its container has no use for fixed pixels.
 * Container resize is handled by the browser (percentages), so there is no re-pack on resize — the
 * component only re-packs when the items or weights change.
 *
 * `react` is a peer dependency (not bundled) so this stays tree-shakeable and framework-neutral.
 */
import { Children, type CSSProperties, isValidElement, type ReactNode, useMemo } from 'react';
import { neededRows, packGrid } from './grid-pack';

export type GridItemProps = {
  children?: ReactNode;
  /** Relative area. Defaults to 1; a 2 gets ~twice the space of a 1. Ignored on the axis pinned by
   * `cols`/`rows` below (that axis is exact, not weighted). */
  weight?: number;
  /**
   * Pin this item to exactly `cols` grid columns instead of an auto-computed, weight-driven width.
   * Giving *any* item a `cols` or `rows` switches the whole `<GridPack>` from the free-fill
   * treemap to native CSS Grid (`grid-auto-flow: dense`) — see `fill`'s doc for what that trades
   * away. If only `cols` is given, the row span still comes from `weight` (rounded).
   */
  cols?: number;
  /** Pin this item to exactly `rows` grid rows. See `cols`. */
  rows?: number;
};

/** Marker component — GridPack reads its props and renders its children in the assigned block. */
export const GridItem = (_: GridItemProps): null => null;

export type GridPackProps = {
  children?: ReactNode;
  cols?: number;
  rows?: number;
  gap?: number | string;
  /**
   * `true` (default): stretch to fill the container's height exactly.
   * `false`: keep the columns fixed and flow downward at `rowHeight` per row (the container grows).
   * The item placement is identical either way — only the overall height changes.
   */
  fill?: boolean;
  /** Row height when `fill` is false. Ignored when filling. */
  rowHeight?: number | string;
  /**
   * `true` (default): items transition their position/size smoothly when weights or the item set
   * change, instead of snapping. Off for users who prefer reduced motion, regardless of this prop.
   * No effect in pinned-span mode (see `GridItemProps.cols`) — CSS Grid track placement isn't a
   * transitionable value; animating that needs a FLIP-style JS technique, which is out of scope
   * for a placement-only library.
   */
  animate?: boolean;
  showGrid?: boolean;
  className?: string;
  style?: CSSProperties;
};

/** Row/column span for one item in pinned-span mode. The pinned axis is exact; the free axis (if
 * any) falls back to `weight`, and an item with neither pin just aims for a `weight`-sized square. */
export const spanFor = (props: GridItemProps, cols: number): { colSpan: number; rowSpan: number } => {
  const weight = typeof props.weight === 'number' && props.weight > 0 ? props.weight : 1;
  const clampCols = (n: number) => Math.max(1, Math.min(cols, Math.round(n)));
  if (props.cols != null && props.rows != null) return { colSpan: clampCols(props.cols), rowSpan: Math.max(1, Math.round(props.rows)) };
  if (props.cols != null) return { colSpan: clampCols(props.cols), rowSpan: Math.max(1, Math.round(weight)) };
  if (props.rows != null) return { colSpan: clampCols(weight), rowSpan: Math.max(1, Math.round(props.rows)) };
  const side = Math.max(1, Math.round(Math.sqrt(weight)));
  return { colSpan: Math.min(cols, side), rowSpan: side };
};

export const GridPack = ({
  children,
  cols = 7,
  rows = 7,
  gap = 8,
  fill = true,
  rowHeight = 96,
  animate = true,
  showGrid = false,
  className,
  style,
}: GridPackProps) => {
  const items = Children.toArray(children).filter(isValidElement) as React.ReactElement<GridItemProps>[];
  const weights = items.map((c) => (typeof c.props.weight === 'number' && c.props.weight > 0 ? c.props.weight : 1));
  const pinned = items.some((c) => c.props.cols != null || c.props.rows != null);

  const placements = useMemo(
    () => (pinned ? [] : packGrid(weights.map((weight, id) => ({ id, weight })), { cols, rows })),
    // Weights + count drive the layout; re-pack only when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [pinned, weights.join(','), cols, rows],
  );

  const gapValue = typeof gap === 'number' ? `${gap}px` : gap;
  const rowHeightValue = typeof rowHeight === 'number' ? `${rowHeight}px` : rowHeight;
  // ponytail: read once per render, not watched live — a user flipping the OS motion setting
  // mid-session and expecting this exact grid to react instantly is a vanishingly small case.
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const transition = animate && !reducedMotion ? 'left 260ms ease, top 260ms ease, width 260ms ease, height 260ms ease' : undefined;

  // Pinned-span mode: at least one item wants an exact col/row span, so hand placement to native
  // CSS Grid (`grid-auto-flow: dense`) instead of the free-fill treemap — packing arbitrary fixed
  // spans around flexible ones is a bin-packing problem the browser already solves well; not worth
  // reinventing here. Trade-off: `dense` can visually reorder items to fill gaps, and grid-track
  // changes don't support the `transition` used above (no FLIP-style animation in pinned mode).
  if (pinned) {
    const gridStyle: CSSProperties = {
      display: 'grid',
      gridTemplateColumns: `repeat(${cols}, 1fr)`,
      gridAutoFlow: 'row dense',
      gap: gapValue,
      ...(fill ? { gridAutoRows: '1fr', height: '100%' } : { gridAutoRows: rowHeightValue }),
      ...(showGrid
        ? { backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)', backgroundSize: `calc(100% / ${cols}) 100%` }
        : {}),
      ...style,
    };
    return (
      <div className={className} style={gridStyle}>
        {items.map((item, i) => {
          const { colSpan, rowSpan } = spanFor(item.props, cols);
          return (
            <div key={i} style={{ gridColumn: `span ${colSpan}`, gridRow: `span ${rowSpan}`, minWidth: 0, minHeight: 0 }}>
              {item.props.children}
            </div>
          );
        })}
      </div>
    );
  }

  const containerStyle: CSSProperties = {
    position: 'relative',
    width: '100%',
    ...(fill ? { height: '100%' } : { height: `calc(${rowHeightValue} * ${neededRows(items.length, cols, rows)})` }),
    ...(showGrid
      ? { backgroundImage: 'linear-gradient(90deg, rgba(255,255,255,.06) 1px, transparent 0)', backgroundSize: `calc(100% / ${cols}) 100%` }
      : {}),
    ...style,
  };

  return (
    <div className={className} style={containerStyle}>
      {placements.map((p, i) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.x * 100}%`,
            top: `${p.y * 100}%`,
            width: `${p.w * 100}%`,
            height: `${p.h * 100}%`,
            transition,
            padding: `calc(${gapValue} / 2)`,
            boxSizing: 'border-box',
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
