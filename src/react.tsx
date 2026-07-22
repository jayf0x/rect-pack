/**
 * `@rect-pack/react` — thin React wrapper over {@link ./grid-pack}.
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
  /** Relative area. Defaults to 1; a 2 gets ~twice the space of a 1. */
  weight?: number;
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
   */
  animate?: boolean;
  showGrid?: boolean;
  className?: string;
  style?: CSSProperties;
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

  const placements = useMemo(
    () => packGrid(weights.map((weight, id) => ({ id, weight })), { cols, rows }),
    // Weights + count drive the layout; re-pack only when those change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [weights.join(','), cols, rows],
  );

  const gapValue = typeof gap === 'number' ? `${gap}px` : gap;
  const rowHeightValue = typeof rowHeight === 'number' ? `${rowHeight}px` : rowHeight;
  // ponytail: read once per render, not watched live — a user flipping the OS motion setting
  // mid-session and expecting this exact grid to react instantly is a vanishingly small case.
  const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const transition = animate && !reducedMotion ? 'left 260ms ease, top 260ms ease, width 260ms ease, height 260ms ease' : undefined;

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
