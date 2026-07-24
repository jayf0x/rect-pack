# AGENTS.md

Working notes for agents/contributors on `weighted-grid`.

## What this is

A zero-dependency TypeScript library + `@weighted-grid/react` component that lays out a weighted,
content-agnostic grid filling its container. See `docs/why.md` for the product rationale. **Read
it before making structural changes.**

## Layout

- `src/react.tsx` — `<Grid>` / `<GridItem>`, the `@weighted-grid/react` entry and the **one layout
  engine** (`SpanGrid`). Each item maps to an exact CSS-Grid col/row span via `spanFor` (`weight`
  sizes both axes; `cols`/`rows` pin an axis and make the item *strict*). `SpanGrid` owns placement
  (`placeSpans`, strict source order, explicit `grid-column`/`grid-row` lines). The single layout
  switch is **`fill`** — how leftover cells are resolved: `"none"` (gaps stay), `"stretch"` (default;
  grow weight-only items fairly into gaps via `fillDeadZones`, capped by `stretch`), `"component"`
  (render `renderEmpty` in empty cells), `"both"`. `height` (`"fill"` | px) is the only other switch.
- `src/utils.ts` — placement + render helpers for `src/react.tsx`: `spanFor`, `placeSpans`,
  `packedRowCount`, `fillDeadZones` (fair round-robin growth), `isElasticItem`, `toCss`, `asGridItems`.
- `src/core.ts` / `src/types.ts` / `src/index.ts` — the standalone `layoutGrid` allocator (a
  squarified treemap in continuous `[0,1]²` space, fractional output) + its core-only types. **No
  longer used by the React grid** (the `treemap` mode was removed); kept as a separate zero-dep
  export. Candidate for extraction/removal — confirm nobody imports `layoutGrid` standalone first.
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
bun scripts/dead-zones.ts    # QA: dead-zone map + dead%/badness for the Showcase span config
```

`scripts/dead-zones.ts` analyzes empty space in the span grid from the placement model
(`placeSpans`) — no browser. Also importable (`analyzeSpans`, `analyzeItems`) for tests; see
`tests/dead-zones.test.ts` and `.claude/next-agent-prompt.md`.

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
