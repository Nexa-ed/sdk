import * as p from "@clack/prompts";
import fs from "fs-extra";
import path from "node:path";
import { copySkillFiles, skillDestPath } from "../utils/skillFiles";

/** Standalone `create-nexaed-app skill` command — drops the Nexa-Ed skill into an existing project. */
export async function runSkill(): Promise<void> {
  const cwd = process.cwd();
  const dest = skillDestPath(cwd);

  p.intro("nexaed skill — installing the Nexa-Ed Claude Code skill");

  if (await fs.pathExists(dest)) {
    const overwrite = await p.confirm({
      message: `${path.relative(cwd, dest)} already exists. Overwrite?`,
      initialValue: false,
    });
    if (p.isCancel(overwrite) || !overwrite) {
      p.outro("Skipped — existing skill left untouched.");
      return;
    }
  }

  await copySkillFiles(cwd);
  p.outro(
    `Installed at ${path.relative(cwd, dest)} — Claude Code picks it up automatically.`,
  );
}
