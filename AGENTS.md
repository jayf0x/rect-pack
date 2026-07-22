# AGENTS.md

Working notes for agents/contributors on `rect-pack`.

## What this is

A zero-dependency TypeScript library + `@rect-pack/react` component that lays out a weighted,
content-agnostic grid filling its container. See `docs/why.md` for the product rationale and
`handover.md` for the current roadmap. **Read both before making structural changes.**

## Layout

- `src/grid-pack.ts` — the allocator (`packGrid`). The heart of the library: a squarified treemap
  in continuous `[0,1]x[0,1]` space. Output is fractional (`{ id, x, y, w, h }`), not integer cells.
- `src/react.tsx` — `<GridPack>` / `<GridItem>`, the `@rect-pack/react` entry. Renders placements as
  absolutely-positioned percentage boxes. React is an **optional** peer dependency.
- `src/index.ts` — main entry; re-exports `packGrid` and its types. No other engine lives here.
- `tests/grid-pack.test.ts` — invariant tests (exact fill, no overlap, in-bounds, area fidelity,
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
  ships with a test proving that invariant still holds (see `tests/grid-pack.test.ts`).
- `cols`/`rows` only steer squarify's nominal aspect ratio (see `neededRows` in `src/grid-pack.ts`)
  — they are not a hard pixel grid. Don't reintroduce integer cell snapping unless asked.
- Biome for format/lint (`biome.json`). TS strict.

## Reference material

`.idea/d3-hierarchy/` is a vendored clone of d3-hierarchy — source of the ported squarified treemap
algorithm (`src/treemap/squarify.js`, `dice.js`, `slice.js`), now ported into `src/grid-pack.ts`.
BSD-licensed — attribution lives in `.idea/d3-hierarchy/LICENSE`. It is **not** a dependency; do not
import it at runtime.
