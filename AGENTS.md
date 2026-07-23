# AGENTS.md

Working notes for agents/contributors on `weighted-grid`.

## What this is

A zero-dependency TypeScript library + `@weighted-grid/react` component that lays out a weighted,
content-agnostic grid filling its container. See `docs/why.md` for the product rationale. **Read
it before making structural changes.**

## Layout

- `src/core.ts` — the allocator (`layoutGrid`). The heart of the library: a squarified treemap
  in continuous `[0,1]x[0,1]` space. Output is fractional (`{ id, x, y, w, h }`), not integer cells.
- `src/types.ts` — core-only types (`GridInput`, `GridPlacement`, `GridOptions`). No `react` import
  here — this is what keeps `src/index.ts` usable without the `react` peer dependency installed.
- `src/react.tsx` — `<Grid>` / `<GridItem>`, the `@weighted-grid/react` entry. Owns every
  React-specific type (`GridProps`, `GridItemProps`, ...) and the `GridItem` component itself.
  Two engines, chosen explicitly (no silent flip): the default **span grid** (`SpanGrid`) maps each
  item to an exact native CSS-Grid col/row span via `spanFor`, and the opt-in **treemap**
  (`FreeGrid`, `isTreemap`) renders the `core.ts` allocator as absolutely-positioned percentage
  boxes. `weight` sizes both axes (equal weights = equal squares); `cols`/`rows` override per-axis.
  React is an **optional** peer dependency.
- `src/utils.ts` — render-side helpers used only by `src/react.tsx` (`spanFor`, `toCss`,
  `asValidElements`, `useReducedMotion`, `defined`).
- `src/index.ts` — main entry; re-exports `layoutGrid` and core-only types. No other engine lives
  here — don't re-export anything from `src/react.tsx` or `src/types.ts`'s React-facing cousins.
- `tests/core.test.ts` — invariant tests (exact fill, no overlap, in-bounds, area fidelity,
  bounded aspect ratio, determinism). Extend these when touching the allocator.
- `demo/` — standalone React (Vite) app importing the library from source. Not part of the package.

## Commands

```bash
bun test            # run all tests (bun:test)
bun run typecheck   # tsc --noEmit
bun run build       # vite lib build → dist/ (index + react entries)
bun run format      # biome check --write
cd demo && bunx vite build   # verify the demo compiles
```

## Conventions

- **Zero runtime dependencies** in the published package — keep it that way (react is a peer dep).
- Sizing is by relative **`weight`** only. No fixed-pixel item sizes — a resizable grid doesn't need
  them.
- Rendering is **native CSS** (percentage-based absolute positioning); the JS only computes
  placement. Don't reimplement layout the browser already does.
- The allocator must always produce a gap-free, overlap-free tiling of the unit square. Any change
  ships with a test proving that invariant still holds (see `tests/core.test.ts`).
- `cols`/`rows` only steer squarify's nominal aspect ratio (see `neededRows` in `src/core.ts`)
  — they are not a hard pixel grid. Don't reintroduce integer cell snapping unless asked.
- Boolean props/state get an `is`/`should` prefix (`isFillHeight`, `isAnimated`, `isGridVisible`,
  `isPinned`, `isReducedMotion`) — keep new ones consistent.
- Biome for format/lint (`biome.json`). TS strict.

## Reference material

`.idea/d3-hierarchy/` is a vendored clone of d3-hierarchy — source of the ported squarified treemap
algorithm (`src/treemap/squarify.js`, `dice.js`, `slice.js`), now ported into `src/core.ts`.
BSD-licensed — attribution lives in `.idea/d3-hierarchy/LICENSE`. It is **not** a dependency; do not
import it at runtime.
