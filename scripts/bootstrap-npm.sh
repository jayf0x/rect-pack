#!/usr/bin/env bash
set -euo pipefail

# One-time only: publishes the very first version of a package manually.
#
# Trusted publishing (OIDC) can only be *configured* on npmjs.com once a package with that name
# already exists on the registry — so the first version has to go up through a normal
# authenticated `npm publish`. Every version after this one goes through `publish-npm.sh` +
# GitHub Actions using OIDC, no token involved.
#
# Requires `npm login` (or a valid granular access token in ~/.npmrc) with publish rights.

NAME=$(node -p "require('./package.json').name")
VERSION=$(node -p "require('./package.json').version")

if npm view "$NAME" version >/dev/null 2>&1; then
  echo "✗ $NAME is already on the registry — bootstrap already done, use scripts/publish-npm.sh instead"
  exit 1
fi

if ! npm whoami >/dev/null 2>&1; then
  echo "✗ Not authenticated to npm — run 'npm login' (or fix the token in ~/.npmrc) first"
  exit 1
fi

echo "Publishing $NAME@$VERSION as the initial release..."
bun run build
bun run test

npm publish --access public --ignore-scripts

echo ""
echo "✓ Published $NAME@$VERSION"
echo ""
echo "Next (one-time, on npmjs.com):"
echo "  1. https://www.npmjs.com/package/$NAME/access → Add trusted publisher"
echo "     GitHub repo: jayf0x/weighted-grid, workflow: publish.yml"
echo "  2. Same page → Publishing access → require trusted publisher / disallow tokens"
echo "  3. Revoke the token you just used to publish manually"
echo ""
echo "From here on, run scripts/publish-npm.sh for every release — CI publishes via OIDC."
