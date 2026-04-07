#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import { spawnSync } from "node:child_process";
import { runPrompts } from "./prompts";
import { scaffold } from "./scaffold";

/** Detect the package manager used to run this CLI (pnpm/yarn/npm). */
function detectPackageManager(): string {
  const agent = process.env["npm_config_user_agent"] ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  return "npm";
}

async function main() {
  // Accept an optional project name as the first CLI argument
  const nameArg = process.argv[2];

  try {
    const opts = await runPrompts(nameArg);
    const pm = detectPackageManager();

    const spinner = p.spinner();
    spinner.start("Scaffolding your app…");

    try {
      await scaffold(opts);
      spinner.stop("Files created.");
    } catch (err: any) {
      spinner.stop("Failed.");
      p.log.error(err.message ?? String(err));
      process.exit(1);
    }

    spinner.start(`Installing dependencies with ${pm}…`);
    const result = spawnSync(pm, ["install"], {
      cwd: opts.projectDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });

    if (result.status !== 0) {
      spinner.stop("Dependency install failed — run it manually.");
      p.log.warn(`Run: cd ${opts.projectName} && ${pm} install`);
    } else {
      spinner.stop("Dependencies installed.");
    }

    p.outro(
      [
        ``,
        pc.green(`✔ ${opts.projectName} is ready!`),
        ``,
        `  Next steps:`,
        ``,
        pc.cyan(`  1. cd ${opts.projectName}`),
        pc.cyan(`  2. Fill in .env.local`),
        pc.cyan(`  3. pnpm dev`),
        ``,
        `  Docs: ${pc.underline("https://docs.nexa-ed.com")}`,
        ``,
      ].join("\n"),
    );
  } catch (err: any) {
    p.log.error(err?.message ?? String(err));
    process.exit(1);
  }
}

main();
