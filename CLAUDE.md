# CLAUDE.md

Start here, then read the linked files — this repo keeps its context in docs, not in this file.

- **[AGENTS.md](AGENTS.md)** — repo layout, commands, conventions. Read before any change.
- **[docs/why.md](docs/why.md)** — why this package exists and what it deliberately is *not*.
- **[handover.md](handover.md)** — current state and the next engineering steps (the squarified
  treemap rewrite + legacy-engine deletion).

TL;DR: a zero-dependency, weight-driven, content-agnostic React grid that fills its container, with
one `fill` prop toggling stretch-to-fill vs fixed-columns. Native CSS Grid renders; the JS only
computes placement. Keep it lazy and dependency-free.
