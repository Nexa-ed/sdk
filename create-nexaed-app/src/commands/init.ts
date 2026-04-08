import * as p from "@clack/prompts";
import pc from "picocolors";
import { spawnSync } from "node:child_process";
import type { ParsedArgs } from "../utils/parseArgs";
import { runPrompts } from "../prompts";
import { scaffold } from "../scaffold";
import { handleTelemetryConsent } from "../utils/telemetry";

function detectPackageManager(): string {
  const agent = process.env["npm_config_user_agent"] ?? "";
  if (agent.startsWith("pnpm")) return "pnpm";
  if (agent.startsWith("yarn")) return "yarn";
  return "npm";
}

/** Thin wrapper: uses clack spinner in TTY, plain console.log in CI. */
function makeSpinner() {
  if (process.stdout.isTTY) {
    const s = p.spinner();
    return {
      start: (msg: string) => s.start(msg),
      stop: (msg: string) => s.stop(msg),
    };
  }
  return {
    start: (msg: string) => console.log(msg),
    stop: (msg: string) => console.log(msg),
  };
}

export async function runInit(args: ParsedArgs): Promise<void> {
  const opts = await runPrompts(args.projectName, {
    auth: args.auth,
    ui: args.ui,
    features: args.features,
    emailTier: args.emailTier,
    emailDomain: args.emailDomain,
    apiKey: args.apiKey,
  });

  const pm = args.pm ?? detectPackageManager();

  // Telemetry consent (asked once, then remembered; skipped in CI)
  await handleTelemetryConsent({
    event: "init",
    features: opts.features,
    authProvider: opts.authProvider,
    pm,
  });

  const spinner = makeSpinner();
  spinner.start("Scaffolding your app…");

  try {
    await scaffold(opts);
    spinner.stop("Files created.");
  } catch (err: any) {
    spinner.stop("Failed.");
    console.error(err.message ?? String(err));
    process.exit(1);
  }

  if (!args.noInstall) {
    spinner.start(`Installing dependencies with ${pm}…`);
    const result = spawnSync(pm, ["install"], {
      cwd: opts.projectDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) {
      spinner.stop("Dependency install failed — run it manually.");
      console.warn(`Run: cd ${opts.projectName} && ${pm} install`);
    } else {
      spinner.stop("Dependencies installed.");
    }
  }

  const shadcnHint =
    opts.uiLibrary === "shadcn"
      ? [pc.dim(`     Then add components: pnpm dlx shadcn@latest add button`)]
      : [];

  const steps = [
    pc.cyan(`  1. cd ${opts.projectName}`),
    ...(args.noInstall
      ? [
          pc.cyan(`  2. ${pm} install`),
          pc.cyan(`  3. Fill in .env.local`),
          pc.cyan(`  4. ${pm} dev`),
          ...shadcnHint,
        ]
      : [
          pc.cyan(`  2. Fill in .env.local`),
          pc.cyan(`  3. ${pm} dev`),
          ...shadcnHint,
        ]),
  ];

  const outroLines = [
    ``,
    pc.green(`✔ ${opts.projectName} is ready!`),
    ``,
    `  Next steps:`,
    ``,
    ...steps,
    ``,
    `  Docs: ${pc.underline("https://docs.nexa-ed.com")}`,
    ``,
  ].join("\n");

  if (process.stdout.isTTY) {
    p.outro(outroLines);
  } else {
    console.log(outroLines);
  }
}
