#!/usr/bin/env node
// Bumps package.json's patch version only, and only when the current version
// still shares the same major/minor boundary as the latest tagged release.
//
// Usage:
//   scripts/patch-json.mjs              # patch bump (0.1.0 -> 0.1.1)
//   scripts/patch-json.mjs patch        # same as above, kept for compatibility
//   PKG_JSON=other.json scripts/patch-json.mjs

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';

const file = process.env.PKG_JSON ?? 'package.json';

const pkg = JSON.parse(readFileSync(file, 'utf8'));
const versionMatch = /^(\d+)\.(\d+)\.(\d+)$/.exec(pkg.version);

if (!versionMatch) {
  console.error(`✗ Invalid package version: ${pkg.version}`);
  process.exit(1);
}

const [major, minor, patch] = versionMatch.slice(1).map(Number);

let previousRelease;
try {
  const latestTag = execFileSync(
    'git',
    ['tag', '--list', 'v*', '--sort=-version:refname'],
    { encoding: 'utf8' },
  )
    .trim()
    .split('\n')
    .find(Boolean);

  if (latestTag) {
    const releaseMatch = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(latestTag);
    if (!releaseMatch) {
      throw new Error(`Invalid git tag version: ${latestTag}`);
    }

    const [prevMajor, prevMinor] = releaseMatch.slice(1, 3).map(Number);
    previousRelease = { major: prevMajor, minor: prevMinor };
  }
} catch {
  previousRelease = null;
}

if (previousRelease && (previousRelease.major !== major || previousRelease.minor !== minor)) {
  console.error(
    `✗ Refusing to patch: package.json version ${pkg.version} does not share the same major.minor as the latest release ${previousRelease.major}.${previousRelease.minor}.x`,
  );
  process.exit(1);
}

const next = `${major}.${minor}.${patch + 1}`;
pkg.version = next;
writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(next);
