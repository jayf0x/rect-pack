# weighted-grid

<!-- README_HEAD:START -->

[![npm version](https://img.shields.io/npm/v/weighted-grid)](https://www.npmjs.com/package/weighted-grid)
[![license](https://img.shields.io/npm/l/weighted-grid)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](./tsconfig.json)
[![CI](https://github.com/jayf0x/weighted-grid/actions/workflows/ci.yml/badge.svg)](https://github.com/jayf0x/weighted-grid/actions/workflows/ci.yml)


![Preview](./assets/preview.png)


> ⭐ **Star this [repository](https://github.com/jayf0x/weighted-grid) if you'd like to support its growth**

<!-- README_HEAD:END -->

A zero-dependency, weight-driven, content-agnostic React grid that fills its container. Drop in
arbitrary children, optionally tag a few with a `weight`, and the layout resolves itself — no
coordinates, no manual math.

**[▶ Live demo](https://jayf0x.github.io/weighted-grid/)**

## Features

- Placement by a **squarified treemap** — each item's area is proportional to its `weight`, on
  both axes, so aspect ratios stay near-square instead of collapsing into slivers
- One `fill` prop toggles "stretch to fill the container" vs. "fixed columns, flows downward"
- Full TypeScript types, ESM + CJS builds, zero runtime dependencies (`react` is an optional peer)

## Install

```bash
bun add weighted-grid
```
||
```bash
npm install weighted-grid
```

## Quick start

```tsx
import { GridPack, GridItem } from 'weighted-grid/react';

<GridPack cols={7} fill>
  <GridItem weight={4}>hero</GridItem>
  <GridItem>a</GridItem>
  <GridItem>b</GridItem>
  <GridItem>c</GridItem>
</GridPack>;
```

Or use the placement algorithm directly, framework-free:

```typescript
import { packGrid } from 'weighted-grid';

const placed = packGrid([
  { id: 'hero', weight: 4 },
  { id: 'a' },
  { id: 'b' },
]);
// → [{ id, x, y, w, h }, ...]  fractions of the unit square (0..1), tiling it exactly
```

## `<GridPack>` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `cols` | `number` | `7` | Nominal column count squarify targets. Not a hard pixel grid — see `packGrid` below. |
| `rows` | `number` | `7` | Nominal row count; grows automatically if there are more items than `cols * rows`. |
| `gap` | `number \| string` | `8` | Spacing between items (`px` if a number). |
| `fill` | `boolean` | `true` | `true`: stretch to fill the container's height exactly. `false`: fixed `rowHeight` per row, container grows downward. |
| `rowHeight` | `number \| string` | `96` | Row height when `fill` is `false`. Ignored while filling. |
| `animate` | `boolean` | `true` | Smoothly transition position/size when weights or items change, instead of snapping. Off automatically under `prefers-reduced-motion`. |
| `showGrid` | `boolean` | `false` | Render faint column guides behind the items. |
| `className` | `string` | — | Applied to the outer container. |
| `style` | `CSSProperties` | — | Merged into the outer container's inline style. |

## `<GridItem>` props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `weight` | `number` | `1` | Relative area — a `2` gets ~twice the space of a `1`. Ignored on any axis pinned by `cols`/`rows`. |
| `cols` | `number` | — | Pin this item to exactly `cols` grid columns. Giving *any* item a `cols`/`rows` switches the whole `<GridPack>` from the free-fill treemap to native CSS Grid (`grid-auto-flow: dense`). |
| `rows` | `number` | — | Pin this item to exactly `rows` grid rows. |

Pinning `cols`/`rows` on one item switches the whole grid to CSS Grid placement; unpinned items keep filling gaps by `weight`. See [`docs/why.md`](./docs/why.md) for why the two modes share one prop surface.

## `packGrid` (framework-free)

```typescript
packGrid(items: GridInput[], options?: GridPackOptions): GridPlacement[]
```

| Type | Field | Description |
| --- | --- | --- |
| `GridInput` | `id` | `string \| number` — stable identifier, echoed back on the placement. |
| `GridInput` | `weight?` | Relative area, defaults to `1`. |
| `GridPackOptions` | `cols?` | Nominal column count (default `7`). |
| `GridPackOptions` | `rows?` | Nominal row count (default `7`); grows to fit if there are more items than `cols * rows`. |
| `GridPlacement` | `id`, `x`, `y`, `w`, `h` | `x/y/w/h` are fractions of the unit square (`0..1`) that always tile it exactly, with no gaps or overlaps. |

## Development

```bash
bun install
bun run test          # bun test
bun run typecheck
bun run build         # vite → dist/ (ESM + CJS + .d.ts)
bun run format        # biome check --write
bun run demo:dev      # local demo site
```

## License

[MIT](./LICENSE) © [jayF0x](https://github.com/jayf0x)
