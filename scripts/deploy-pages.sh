#!/usr/bin/env bash
# Tags a new demo-N release, which triggers the GitHub Pages deploy workflow.
# Demo has no version of its own, so this just increments the last demo-N tag.
set -euo pipefail

BRANCH=$(git rev-parse --abbrev-ref HEAD)
[[ "$BRANCH" != "main" ]] && { echo "✗ Must be on main (currently: $BRANCH)"; exit 1; }

git fetch --tags --quiet
LAST=$(git tag -l 'demo-*' | sed 's/demo-//' | sort -n | tail -1)
NEXT=$(( ${LAST:-0} + 1 ))
TAG="demo-$NEXT"

git tag "$TAG"
git push origin "$TAG"

echo "✓ Tagged $TAG — GitHub Actions will deploy the demo to Pages"
