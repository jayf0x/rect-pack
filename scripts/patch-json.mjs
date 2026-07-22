#!/usr/bin/env node
// Bumps package.json's version field. Prints the new version on stdout.
//
// Usage:
//   scripts/patch-json.mjs              # patch bump (0.1.0 -> 0.1.1)
//   scripts/patch-json.mjs minor        # minor bump (0.1.0 -> 0.2.0)
//   scripts/patch-json.mjs major        # major bump (0.1.0 -> 1.0.0)
//   scripts/patch-json.mjs 1.2.0        # set explicit version
//   PKG_JSON=other.json scripts/patch-json.mjs patch

import { readFileSync, writeFileSync } from 'node:fs';

const file = process.env.PKG_JSON ?? 'package.json';
const arg = process.argv[2] ?? 'patch';

const pkg = JSON.parse(readFileSync(file, 'utf8'));

let next;
if (/^\d+\.\d+\.\d+$/.test(arg)) {
  next = arg;
} else if (/^(major|minor|patch)$/.test(arg)) {
  const [major, minor, patch] = pkg.version.split('.').map(Number);
  next =
    arg === 'major'
      ? `${major + 1}.0.0`
      : arg === 'minor'
        ? `${major}.${minor + 1}.0`
        : `${major}.${minor}.${patch + 1}`;
} else {
  console.error(`✗ Unknown argument: ${arg} (expected major/minor/patch or an explicit x.y.z)`);
  process.exit(1);
}

pkg.version = next;
writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(next);
