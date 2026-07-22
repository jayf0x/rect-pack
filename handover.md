# Handover — next steps

Read `docs/why.md` first for the product direction. This file is the engineering to-do.

## Where we are now (working, tested)

- `src/grid-pack.ts` — `packGrid(items, { cols?, rows? })`. A **squarified treemap** in continuous
  `[0,1]x[0,1]` space, ported from `d3-hierarchy`'s `squarify.js` (vendored at
  `.idea/d3-hierarchy/`, BSD-licensed, attribution in its `LICENSE`). Each item's *area* is
  proportional to its `weight` on both axes, so aspect ratios stay near-square instead of
  collapsing into slivers in narrow grids. Output is `{ id, x, y, w, h }` fractions that tile the
  unit square exactly. `cols`/`rows` only steer squarify's nominal aspect ratio (`neededRows`),
  they are not a hard pixel grid. Proven by `tests/grid-pack.test.ts`: exact fill (area sums to 1),
  no overlap, in-bounds, area fidelity (rect area / total ≈ weight / total weight), bounded aspect
  ratio, determinism, order-preservation, and soft-grid row growth. No dependencies.
- `src/react.tsx` — `@rect-pack/react`: `<GridPack>` / `<GridItem>`. Same public props as before
  (`cols`, `rows`, `gap`, `fill`, `rowHeight`, `showGrid`). Renders placements as absolutely
  positioned percentage boxes (not CSS Grid tracks) so fractional rects render exactly; `fill`
  toggles container height between `100%` and `calc(rowHeight * neededRows)`.
- The legacy packing engine (`src/core.ts` Guillotine bin packer, `src/pack-logic.ts` +
  `src/cell-grid.ts` area-fit packer, and their tests/exports) is **deleted**. `src/index.ts`,
  `package.json` (description/keywords), and `README.md` now describe only the grid.
- `demo/` — real React app (Vite) showing both flows side by side. Unaffected by the rewrite: it
  only used the `cols`/`fill`/`rowHeight` props, which kept their meaning.
- Build emits two entries (`dist/index.*`, `dist/react.*`); `package.json` `exports` map wired.
- Pre-existing, unrelated: `tsc --noEmit` errors on the two JSX blocks in `src/react.tsx`
  (`TS17004`, no `--jsx` flag in `tsconfig.json`) — present before this rewrite too, doesn't block
  `vite build`, which handles JSX correctly. Fix the tsconfig if a clean `bun run typecheck` matters.

## Smaller follow-ups (backlog)

- **Optional integer snapping**: right now `cols`/`rows` only pick squarify's nominal aspect ratio,
  not a hard pixel grid — a "pixel-crisp" snap-to-grid mode was floated but deliberately skipped as
  speculative (see the `ponytail:` comment in `src/grid-pack.ts`). If wanted: round each rect edge
  to the nearest `1/cols` or `1/rows` post-squarify — same-value edges round identically, so it
  won't reopen gaps.
- Explicit `colSpan`/`rowSpan` placement (a "staircase" of squares without spacer hacks) — layered
  on the same allocator, opt-in per item.
- `showGrid` / `animate` polish; FLIP or `view-transition` animation on weight change.
- Publish wiring: `@rect-pack/react` peer-dep story, size-limit budget for the react entry.
