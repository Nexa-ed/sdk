#!/usr/bin/env node
// Keeps each published package's npm `latest` dist-tag pointed at the newest
// release that is already older than pnpm's default minimumReleaseAge gate
// (24h). Without this, `latest` can point at a release published minutes ago,
// which pnpm refuses to resolve for an unpinned install/create — it silently
// falls back to whatever *is* old enough instead, sometimes far older (see
// create-nexaed-app's guardStaleScaffold, which reacts to that after the
// fact; this makes the gap it reacts to structurally impossible instead).
//
// Run from the repo root: node scripts/promote-latest-tag.mjs
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const GATE_MINUTES = 24 * 60;

function discoverPublishablePackages() {
  const names = [];
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const pkgPath = path.join(ROOT, entry.name, "package.json");
    if (!fs.existsSync(pkgPath)) continue;
    const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
    if (pkg.private || !pkg.name) continue;
    names.push(pkg.name);
  }
  return names;
}

function parseVersion(v) {
  const [core, pre] = v.split("-", 2);
  return {
    nums: core.split(".").map((n) => Number(n) || 0),
    pre: pre ? pre.split(".") : null,
  };
}

// Same prerelease-aware compare as create-nexaed-app's utils/updateNotifier.ts
// isNewer — kept in sync by hand since this script runs standalone in CI.
function isNewer(candidate, current) {
  const a = parseVersion(candidate);
  const b = parseVersion(current);
  for (let i = 0; i < 3; i++) {
    if ((a.nums[i] ?? 0) !== (b.nums[i] ?? 0)) return (a.nums[i] ?? 0) > (b.nums[i] ?? 0);
  }
  if (!a.pre && b.pre) return true;
  if (a.pre && !b.pre) return false;
  if (!a.pre || !b.pre) return false;
  const len = Math.max(a.pre.length, b.pre.length);
  for (let i = 0; i < len; i++) {
    const x = a.pre[i];
    const y = b.pre[i];
    if (x === undefined) return false;
    if (y === undefined) return true;
    if (x === y) continue;
    const xn = Number(x);
    const yn = Number(y);
    if (!Number.isNaN(xn) && !Number.isNaN(yn)) return xn > yn;
    return x > y;
  }
  return false;
}

async function promote(pkgName) {
  const res = await fetch(`https://registry.npmjs.org/${encodeURIComponent(pkgName)}`);
  if (!res.ok) {
    console.warn(`⚠︎ ${pkgName}: registry returned HTTP ${res.status} — skipping`);
    return;
  }
  const data = await res.json();
  const cutoff = Date.now() - GATE_MINUTES * 60 * 1000;
  const eligible = Object.keys(data.versions ?? {}).filter((v) => {
    const publishedAt = data.time?.[v];
    return publishedAt && new Date(publishedAt).getTime() <= cutoff;
  });

  if (eligible.length === 0) {
    console.log(`${pkgName}: no release is older than ${GATE_MINUTES / 60}h yet — skipping`);
    return;
  }

  const target = eligible.reduce((best, v) => (isNewer(v, best) ? v : best));
  const current = data["dist-tags"]?.latest;

  if (current === target) {
    console.log(`${pkgName}: latest already ${current} — nothing to do`);
    return;
  }

  console.log(`${pkgName}: moving latest ${current ?? "(unset)"} -> ${target}`);
  execFileSync("npm", ["dist-tag", "add", `${pkgName}@${target}`, "latest"], {
    stdio: "inherit",
  });
}

const packages = discoverPublishablePackages();
console.log("Checking packages:", packages.join(", "));

let failures = 0;
for (const pkg of packages) {
  try {
    await promote(pkg);
  } catch (err) {
    failures++;
    console.error(`✗ ${pkg}: ${err?.message ?? err}`);
  }
}

if (failures > 0) process.exit(1);
