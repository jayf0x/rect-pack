#!/usr/bin/env bash
set -euo pipefail

# ── git sanity checks ─────────────────────────────────────────────────────────
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[[ "$BRANCH" != "main" ]] && { echo "✗ Must be on main (currently: $BRANCH)"; exit 1; }

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "✗ Uncommitted changes — stash or commit first"
  exit 1
fi

# ── build + typecheck + test ─────────────────────────────────────────────────
bun run build
bun run typecheck
bun run test
bun run format

# ── version bump ──────────────────────────────────────────────────────────────
# BUMP=patch|minor|major, or pass an explicit version: BUMP=1.2.0
NEW=$(bun "$(dirname "$0")/patch-json.mjs" "${BUMP:-patch}")
TAG="v$NEW"

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "✗ Tag $TAG already exists — was a previous publish interrupted?"
  exit 1
fi

echo "Bumped to $NEW"

# ── commit + tag + push (GHA workflow handles npm publish) ────────────────────
git add .
git commit -m "chore: release $NEW"
git tag "$TAG"
git push origin HEAD
git push origin "$TAG"

echo ""
echo "✓ Tagged $TAG — GitHub Actions will publish to npm"
