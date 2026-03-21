#!/usr/bin/env node
import * as p from "@clack/prompts";
import pc from "picocolors";
import { runPrompts } from "./prompts";
import { scaffold } from "./scaffold";

async function main() {
  // Accept an optional project name as the first CLI argument
  const nameArg = process.argv[2];

  try {
    const opts = await runPrompts(nameArg);

    const spinner = p.spinner();
    spinner.start("Scaffolding your app…");

    try {
      await scaffold(opts);
      spinner.stop("Done!");
    } catch (err: any) {
      spinner.stop("Failed.");
      p.log.error(err.message ?? String(err));
      process.exit(1);
    }

    p.outro(
      [
        ``,
        pc.green(`✔ ${opts.projectName} is ready!`),
        ``,
        `  Next steps:`,
        ``,
        pc.cyan(`  1. cd ${opts.projectName}`),
        pc.cyan(`  2. pnpm install`),
        pc.cyan(`  3. Fill in .env.local`),
        pc.cyan(`  4. pnpm dev`),
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
