#!/usr/bin/env bash
# Build weighted-grid and copy its dist into a consuming app's node_modules — a local override so
# you can iterate without publishing. Plain copy (not a symlink) so the files' realpath stays inside
# the app, and react resolves from the app (no duplicate-React / invalid-hook-call).
#
# Usage: scripts/link-local.sh [path-to-app]   (default: ../jayf0x.github.io)
# Reset:  run `bun install --force` in the app to restore the published package.
set -euo pipefail

PKG_DIR="$(cd "$(dirname "$0")/.." && pwd)"
APP="${1:-/Users/me/Documents/GitHub/jayf0x.github.io}"
DEST="$APP/node_modules/weighted-grid"

[ -d "$DEST" ] || { echo "error: $DEST not found — is weighted-grid installed in the app?" >&2; exit 1; }

(cd "$PKG_DIR" && bun run build)

rm -rf "$DEST/dist"
cp -R "$PKG_DIR/dist" "$DEST/dist"
rm -rf "$APP/node_modules/.vite"

echo "copied $PKG_DIR/dist -> $DEST/dist and cleared $APP/node_modules/.vite"
