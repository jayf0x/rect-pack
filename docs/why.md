# Why this package exists

## The one-line pitch

**A content-agnostic React grid that fills its container by *weight*, with a single prop to
toggle between "stretch to fill" and "fixed columns".** You drop in arbitrary children, optionally
tag a few with a `weight`, and the layout resolves itself — no coordinates, no image assumptions,
no manual math, zero dependencies.

## The honest landscape

The core algorithm — subdivide a rectangle so each item's *area* is proportional to its *weight* —
is a solved problem called a **treemap** (see `d3-hierarchy`'s squarified treemap). We are **not**
claiming new algorithmic ground. What does not exist off the shelf is the *ergonomic packaging* of
that idea for general React UI:

| Existing solution | What it does | Why it isn't this |
| --- | --- | --- |
| `react-photo-album`, `react-grid-gallery` | Justified image galleries | Images only; row-justified to width; no arbitrary children; no weights |
| `react-grid-layout`, `gridstack`, `muuri` | Draggable dashboards | **Manual** x/y/w/h placement — you position everything yourself |
| `d3-hierarchy` `treemap()` | The exact weighted-fill math | A data-viz primitive, not a drop-in component; you wire up rendering |
| native CSS Grid `repeat(n, 1fr)` | The "fixed columns" flow | It *is* one line of CSS — we lean on it, we don't replace it |

**The gap we fill:** the small, boring, content-agnostic React layer that turns "here are some
boxes, some matter more" into a filled, responsive grid — and unifies the layout flows people
actually want behind two plain props, `mode` and `height`.

## The two flows, one placement

The span-grid modes (`mode="pack"`/`"order"`) use the **same** weight-driven span assignment. Only
the row sizing differs, and it's the `height` prop, not the engine:

- `height="fill"` (default): rows split the container height, so the grid **stretches to fill it
  exactly**. Resizing the container is free; the browser reflows, no JS re-pack.
- `height={number}`: rows are a fixed pixel height, so the grid **keeps its columns and flows
  downward** (the container grows / scrolls) — the familiar CSS-grid look.

This is the crux of the product: the difference between "masonry-ish filled dashboard" and "plain
column grid" should be one prop, not two libraries. `mode="treemap"` is the separate opt-in for
exact gap-free weighted-area fill (`weight` as area), where `height` behaves the same way.

## Non-goals

- Not an image gallery (use `react-photo-album`).
- Not a drag-and-drop dashboard (use `react-grid-layout`).
- Not a general data-viz treemap (use `d3-hierarchy`).
- Not a fixed-pixel layout engine — a grid that resizes with its container has no use for fixed px;
  everything is relative `weight`.
