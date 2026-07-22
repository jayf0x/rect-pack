# rect-pack

[![CI](https://github.com/jayf0x/rect-pack/actions/workflows/ci.yml/badge.svg)](https://github.com/jayf0x/rect-pack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A zero-dependency, weight-driven, content-agnostic React grid that fills its container. Drop in
arbitrary children, optionally tag a few with a `weight`, and the layout resolves itself — no
coordinates, no manual math. See [`docs/why.md`](docs/why.md) for the product rationale.

**[▶ Live demo](https://jayf0x.github.io/rect-pack/)**

## Features

- Placement by a **squarified treemap** — each item's area is proportional to its `weight`, on
  both axes, so aspect ratios stay near-square instead of collapsing into slivers
- One `fill` prop toggles "stretch to fill the container" vs. "fixed columns, flows downward"
- Full TypeScript types, ESM + CJS builds, zero runtime dependencies (`react` is an optional peer)

## Install

```bash
npm install rect-pack
```

## Quick start

```tsx
import { GridPack, GridItem } from 'rect-pack/react';

<GridPack cols={7} fill>
  <GridItem weight={4}>hero</GridItem>
  <GridItem>a</GridItem>
  <GridItem>b</GridItem>
  <GridItem>c</GridItem>
</GridPack>;
```

Or use the placement algorithm directly, framework-free:

```typescript
import { packGrid } from 'rect-pack';

const placed = packGrid([
  { id: 'hero', weight: 4 },
  { id: 'a' },
  { id: 'b' },
]);
// → [{ id, x, y, w, h }, ...]  fractions of the unit square (0..1), tiling it exactly
```

## Development

```bash
bun install
bun run test          # bun test
bun run typecheck
bun run build         # vite → dist/ (ESM + CJS + .d.ts)
bun run format        # biome check --write
bun run demo:dev      # local demo site
```

## Publishing

`bun run npm:deploy` (optionally `BUMP=minor`) bumps the version, builds, tags, and pushes.
The [`publish`](.github/workflows/publish.yml) workflow publishes the new tag to npm.

## License

MIT
