import fs from "node:fs";
import path from "node:path";

export function readCurrentVersion(): string {
  const pkgPath = path.resolve(__dirname, "../package.json");
  const { version } = JSON.parse(fs.readFileSync(pkgPath, "utf8")) as { version: string };
  return version;
}

export async function fetchLatestVersion(): Promise<string | null> {
  try {
    const res = await fetch("https://registry.npmjs.org/create-nexaed-app/latest", {
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return null;
    const { version } = (await res.json()) as { version: string };
    return version ?? null;
  } catch {
    // Network or parse error — silently ignore
    return null;
  }
}

export function updateAvailableMessage(current: string, latest: string): string {
  return (
    `Update available: ${current} → ${latest}\n` +
    `  pnpm/npm cache the scaffolder, so an unpinned run may use the old copy.\n` +
    `  Run the new one explicitly:\n` +
    `    pnpm create nexaed-app@${latest} <name>   (or: npx create-nexaed-app@${latest} <name>)`
  );
}

export async function checkForUpdate(): Promise<string | null> {
  const current = readCurrentVersion();
  const latest = await fetchLatestVersion();
  if (latest && isNewer(latest, current)) {
    return updateAvailableMessage(current, latest);
  }
  return null;
}

/** Minimal semver compare that understands prerelease tags (0.3.0-beta.4 < 0.3.0). */
export function isNewer(candidate: string, current: string): boolean {
  const parse = (v: string) => {
    const [core, pre] = v.split("-", 2);
    return {
      nums: core.split(".").map((n) => Number(n) || 0),
      pre: pre ? pre.split(".") : null,
    };
  };
  const a = parse(candidate);
  const b = parse(current);
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
