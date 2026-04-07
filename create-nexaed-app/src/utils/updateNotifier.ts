import fs from "node:fs";
import path from "node:path";

export async function checkForUpdate(): Promise<string | null> {
  try {
    const pkgPath = path.resolve(__dirname, "../package.json");
    const { version: current } = JSON.parse(
      fs.readFileSync(pkgPath, "utf8"),
    ) as { version: string };

    const res = await fetch(
      "https://registry.npmjs.org/create-nexaed-app/latest",
      { signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) return null;

    const { version: latest } = (await res.json()) as { version: string };
    if (latest !== current) {
      return `Update available: ${current} → ${latest}  Run: pnpm add -g create-nexaed-app`;
    }
  } catch {
    // Network or parse error — silently ignore
  }
  return null;
}
