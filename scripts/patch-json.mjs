#!/usr/bin/env node
// Bumps package.json's patch version only, and only when the current version
// still shares the same major/minor boundary as the latest tagged release.
//
// Usage:
//   scripts/patch-json.mjs              # patch bump (0.1.0 -> 0.1.1)
//   scripts/patch-json.mjs patch        # same as above, kept for compatibility
//   PKG_JSON=other.json scripts/patch-json.mjs

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const getVFromV = (version) => {
  console.log(version);
  if (!/^(\d+)\.(\d+)\.(\d+)$/.test(version)) {
    console.error(`✗ Invalid package version: ${version}`);
    process.exit(1);
  }

  return version.split(".").map(Number);
};

const file = process.env.PKG_JSON ?? "package.json";

const pkg = JSON.parse(readFileSync(file, "utf8"));
let [major, minor, patch] = getVFromV(pkg.version);

let nextVersion = null;
try {
  const latestTag = execFileSync(
    "git",
    ["tag", "--list", "v*", "--sort=-version:refname"],
    { encoding: "utf8" },
  )
    .trim()
    .split("\n")
    .find(Boolean);

  if (latestTag) {
    const prev = getVFromV(latestTag.split("v")[1]);
    if (prev.major === major && prev.minor === minor) {
      patch += 1;
    }
  }
} catch (e) {
  console.error("Could not parse latest tag. Error:", e);
}

const next = `${major}.${minor}.${patch}`;
pkg.version = next;
writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
console.log(next);
