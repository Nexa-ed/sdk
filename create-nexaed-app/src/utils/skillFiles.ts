import fs from "fs-extra";
import path from "node:path";

// Bundled by tsup into dist/index.js, so __dirname at runtime is the
// package's dist/ directory — templates/ ships as a sibling (see package.json "files").
const SKILL_SOURCE_DIR = path.join(
  __dirname,
  "..",
  "templates",
  "skill",
  "nexa-ed-sdk",
);

export function skillDestPath(projectDir: string): string {
  return path.join(projectDir, ".claude", "skills", "nexa-ed-sdk");
}

/** Copies the bundled Nexa-Ed Claude Code skill into `<projectDir>/.claude/skills/nexa-ed-sdk`. */
export async function copySkillFiles(projectDir: string): Promise<string> {
  const dest = skillDestPath(projectDir);
  await fs.copy(SKILL_SOURCE_DIR, dest, { overwrite: true });
  return dest;
}
