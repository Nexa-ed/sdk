import * as p from "@clack/prompts";
import fs from "fs-extra";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { resolveLatestVersions } from "../utils/sdkVersions";
import { repairPnpmWorkspace } from "../utils/pnpmWorkspace";

function detectPM(cwd: string): string {
  const agent = process.env["npm_config_user_agent"] ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  if (agent.startsWith("bun")) return "bun";
  if (fs.pathExistsSync(path.join(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (fs.pathExistsSync(path.join(cwd, "yarn.lock"))) return "yarn";
  if (fs.pathExistsSync(path.join(cwd, "bun.lockb"))) return "bun";
  return "npm";
}

export async function runUpgrade(): Promise<void> {
  const cwd = process.cwd();
  p.intro("nexaed upgrade — updating SDK packages");

  const pkgPath = path.join(cwd, "package.json");
  if (!(await fs.pathExists(pkgPath))) {
    p.log.error("No package.json found in current directory.");
    p.outro("Run nexaed upgrade from inside a school app.");
    return;
  }

  const pkg = (await fs.readJson(pkgPath)) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const nexaDeps = Object.keys(allDeps).filter((d) =>
    d.startsWith("@nexa-ed/"),
  );

  if (nexaDeps.length === 0) {
    p.log.warn("No @nexa-ed/* packages found in package.json.");
    p.outro("Nothing to upgrade.");
    return;
  }

  p.log.info(`Upgrading: ${nexaDeps.join(", ")}`);

  const pm = detectPM(cwd);
  const addCmd = pm === "npm" ? "install" : "add";

  // `@latest` is a dist-tag, not a version — pnpm 11's minimumReleaseAge gate
  // hides any release under 24h old from tag/range resolution, so an unpinned
  // `add @nexa-ed/x@latest` can silently install yesterday's publish. Resolve
  // the real version first and pin it exactly, same as the initial scaffold
  // (see resolveLatestVersions in sdkVersions.ts) — exact versions bypass the
  // gate regardless of whether this project's pnpm-workspace.yaml excludes it.
  const resolved = await resolveLatestVersions(nexaDeps);
  const packages = nexaDeps.map((d) => `${d}@${resolved[d] ?? "latest"}`);

  // Scaffolds from before beta.3 wrote a broken pnpm-workspace.yaml (a literal
  // placeholder instead of `true`), which hard-fails every pnpm 11 install
  // with ERR_PNPM_IGNORED_BUILDS — including this one. Patch it up first so
  // the upgrade below doesn't fail on a problem that has nothing to do with
  // the SDK version bump.
  if (pm === "pnpm" && (await repairPnpmWorkspace(cwd))) {
    p.log.info("Repaired pnpm-workspace.yaml (missing/invalid build approvals).");
  }

  const spinner = p.spinner();
  spinner.start(`Running ${pm} ${addCmd}…`);

  const result = spawnSync(pm, [addCmd, ...packages], {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  if (result.status !== 0) {
    spinner.stop("Upgrade failed.");
    p.outro("Check the error above and try again.");
    process.exit(1);
    return;
  }

  spinner.stop("Done!");
  p.outro("All @nexa-ed/* packages upgraded to latest.");
}
