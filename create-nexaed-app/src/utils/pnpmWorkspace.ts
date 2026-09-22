import fs from "fs-extra";
import path from "node:path";

// Canonical build-script approvals and minimumReleaseAge exclusions every
// generated project needs. Kept in one place so `scaffold` (fresh projects)
// and `upgrade` (existing projects) can't drift out of sync — that drift is
// exactly how pre-beta.3 scaffolds ended up with a broken placeholder here.
export const REQUIRED_ALLOW_BUILDS = [
  "@clerk/shared",
  "esbuild",
  "sharp",
  "unrs-resolver",
];
export const REQUIRED_RELEASE_AGE_EXCLUDE = ["@nexa-ed/*", "create-nexaed-app"];

function quoteIfNeeded(key: string): string {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : `'${key}'`;
}

function renderSections(
  allowBuilds: Record<string, string>,
  releaseAgeExclude: string[],
): string {
  return [
    "# Build-script approvals for pnpm 11+ (pnpm 10 reads the list from package.json).",
    "allowBuilds:",
    ...Object.entries(allowBuilds).map(([k, v]) => `  ${quoteIfNeeded(k)}: ${v}`),
    "# pnpm's minimumReleaseAge supply-chain gate would otherwise silently pin",
    "# @nexa-ed/* to an older publish; always install the newest release.",
    "minimumReleaseAgeExclude:",
    ...releaseAgeExclude.map((v) => `  - '${v}'`),
    "",
  ].join("\n");
}

export function renderPnpmWorkspace(): string {
  const allowBuilds = Object.fromEntries(
    REQUIRED_ALLOW_BUILDS.map((k) => [k, "true"]),
  );
  return renderSections(allowBuilds, [...REQUIRED_RELEASE_AGE_EXCLUDE]);
}

function parseWorkspaceYaml(content: string): {
  allowBuilds: Record<string, string>;
  releaseAgeExclude: string[];
} {
  const allowBuilds: Record<string, string> = {};
  const releaseAgeExclude: string[] = [];
  let section: "allowBuilds" | "releaseAgeExclude" | null = null;
  for (const line of content.split("\n")) {
    if (/^\s*#/.test(line) || line.trim() === "") continue;
    if (/^allowBuilds:\s*$/.test(line)) {
      section = "allowBuilds";
      continue;
    }
    if (/^minimumReleaseAgeExclude:\s*$/.test(line)) {
      section = "releaseAgeExclude";
      continue;
    }
    if (/^\S/.test(line)) {
      section = null;
      continue;
    }
    if (section === "allowBuilds") {
      const m = line.match(/^\s*(['"]?)([^'":]+)\1\s*:\s*(.+?)\s*$/);
      if (m) allowBuilds[m[2]] = m[3];
    } else if (section === "releaseAgeExclude") {
      const m = line.match(/^\s*-\s*(['"]?)(.+?)\1\s*$/);
      if (m) releaseAgeExclude.push(m[2]);
    }
  }
  return { allowBuilds, releaseAgeExclude };
}

// Backfills known-required entries into an existing project's
// pnpm-workspace.yaml without disturbing anything a developer added on top —
// scaffolds from before beta.3 shipped a literal "set this to true or false"
// placeholder instead of `true`, which makes every install hard-fail with
// ERR_PNPM_IGNORED_BUILDS. Returns true if the file was created or changed.
export async function repairPnpmWorkspace(cwd: string): Promise<boolean> {
  const filePath = path.join(cwd, "pnpm-workspace.yaml");
  const existing = (await fs.pathExists(filePath))
    ? await fs.readFile(filePath, "utf8")
    : "";
  const { allowBuilds, releaseAgeExclude } = parseWorkspaceYaml(existing);

  let changed = existing.trim() === "";
  for (const key of REQUIRED_ALLOW_BUILDS) {
    if (allowBuilds[key] !== "true") {
      allowBuilds[key] = "true";
      changed = true;
    }
  }
  for (const entry of REQUIRED_RELEASE_AGE_EXCLUDE) {
    if (!releaseAgeExclude.includes(entry)) {
      releaseAgeExclude.push(entry);
      changed = true;
    }
  }
  if (!changed) return false;

  await fs.writeFile(filePath, renderSections(allowBuilds, releaseAgeExclude));
  return true;
}
