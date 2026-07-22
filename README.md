# rect-pack

[![CI](https://github.com/jayf0x/rect-pack/actions/workflows/ci.yml/badge.svg)](https://github.com/jayf0x/rect-pack/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A high-performance TypeScript library for 2D rectangle packing — area-based packing plus Guillotine bin packing with multiple heuristics for optimal space utilization.

**[▶ Live demo](https://jayf0x.github.io/rect-pack/)**

## Features

- Area-based packing (`rectanglePacker`) and Guillotine bin packing (`GuillotineBinPack`)
- Full TypeScript types, ESM + CJS builds
- Zero runtime dependencies
- Immutable and in-place (`rectanglePackerMutation`) APIs

## Install

```bash
npm install rect-pack
```

## Quick start

### Area-based packing

```typescript
import { rectanglePacker } from 'rect-pack';

const packed = rectanglePacker([
  { width: 100, height: 50 },
  { width: 75, height: 75 },
  { width: 200, height: 100 },
]);
// → [{ width, height, x, y }, ...]  input array is left untouched
```

Use `rectanglePackerMutation(rects)` to assign `x`/`y` on the input array in place.

### Guillotine bin packing

```typescript
import { GuillotineBinPack, Rect } from 'rect-pack';

const packer = new GuillotineBinPack<Rect>(500, 400);
packer.InsertSizes(
  [new Rect(0, 0, 100, 100), new Rect(0, 0, 50, 200)],
  /* merge */ true,
  /* rectChoice */ 0,
  /* splitMethod */ 0,
);
console.log(packer.Occupancy()); // fraction of the bin filled, 0..1
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
