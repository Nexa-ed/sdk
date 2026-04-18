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
    git: args.git,
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

  if (opts.git) {
    const gitEnv = {
      ...process.env,
      GIT_AUTHOR_NAME: "create-nexaed-app",
      GIT_AUTHOR_EMAIL: "scaffold@nexa-ed.com",
      GIT_COMMITTER_NAME: "create-nexaed-app",
      GIT_COMMITTER_EMAIL: "scaffold@nexa-ed.com",
    };
    const initResult = spawnSync("git", ["init"], { cwd: opts.projectDir, stdio: "ignore" });
    if (initResult.error || initResult.status !== 0) {
      p.log.warn("Git not found — skipping repository initialisation. Install git and run `git init` manually.");
    } else {
      spawnSync("git", ["add", "-A"], { cwd: opts.projectDir, stdio: "ignore" });
      const commitResult = spawnSync(
        "git",
        ["commit", "-m", "Initial commit (create-nexaed-app)"],
        { cwd: opts.projectDir, stdio: "ignore", env: gitEnv },
      );
      if (commitResult.status !== 0) {
        p.log.warn("Git repository initialised but initial commit failed. Run `git commit` manually.");
      } else {
        p.log.success("Git repository initialised.");
      }
    }
  }

  if (!args.noInstall) {
    // Print a plain log line — the spinner must not run while the package manager
    // writes its own output to the same terminal.
    p.log.step(`Installing dependencies with ${pm}…`);
    const result = spawnSync(pm, ["install"], {
      cwd: opts.projectDir,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    if (result.status !== 0) {
      p.log.warn(`Dependency install failed. Run manually: cd ${opts.projectName} && ${pm} install`);
    } else {
      p.log.success("Dependencies installed.");
    }
  }

  const dlx: Record<string, string> = {
    pnpm: "pnpm dlx",
    yarn: "yarn dlx",
    bun:  "bunx",
    npm:  "npx",
  };
  const exec = dlx[pm] ?? "npx";

  const shadcnHint =
    opts.uiLibrary === "shadcn"
      ? [pc.dim(`     Then add components: ${exec} shadcn@latest add button`)]
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
