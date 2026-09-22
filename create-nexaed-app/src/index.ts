#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import * as p from "@clack/prompts";
import { parseArgs } from "./utils/parseArgs";
import { runInit } from "./commands/init";
import { runDoctor } from "./commands/doctor";
import { runUpgrade } from "./commands/upgrade";
import { runHelp } from "./commands/help";
import { runSkill } from "./commands/skill";
import {
  checkForUpdate,
  fetchLatestVersion,
  isNewer,
  readCurrentVersion,
  updateAvailableMessage,
} from "./utils/updateNotifier";
import { runTelemetryCommand } from "./utils/telemetry";

// Unpinned `pnpm create nexaed-app` / `npx create-nexaed-app` can silently run
// an old copy: pnpm's default minimumReleaseAge gate hides same-day publishes,
// and dlx caches per-package. Exact-version invocations bypass both, so when
// we detect we're stale we hand the user's original command straight to the
// newest release instead of generating outdated files. Opt out with
// NEXAED_SKIP_UPDATE_CHECK=1 (used by the re-exec'd child to stop looping).
function runnerForLatest(latest: string): { cmd: string; args: string[] } {
  const spec = `create-nexaed-app@${latest}`;
  const ua = process.env.npm_config_user_agent ?? "";
  if (ua.startsWith("pnpm/")) return { cmd: "pnpm", args: ["dlx", spec] };
  if (ua.startsWith("yarn/")) return { cmd: "yarn", args: ["dlx", spec] };
  if (ua.startsWith("bun/")) return { cmd: "bunx", args: [spec] };
  return { cmd: "npx", args: ["--yes", spec] };
}

// Flags this version understands. Their values reach the child through the env
// vars below instead: on the command line they could be swallowed by the
// package manager (`pnpm dlx` knows `--no-install` too) and their values are
// arbitrary user text that would need shell quoting to survive.
const OWN_VALUE_FLAGS: Record<string, string> = {
  "--auth": "NEXAED_AUTH",
  "--ui": "NEXAED_UI",
  "--features": "NEXAED_FEATURES",
  "--email-tier": "NEXAED_EMAIL_TIER",
  "--email-domain": "NEXAED_EMAIL_DOMAIN",
  "--api-key": "NEXAED_API_KEY",
  "--pm": "NEXAED_PM",
};

const OWN_BOOL_FLAGS = new Set(["--no-install", "--git", "--no-git"]);

// A bare project name is the only positional we forward, and only when it is
// plain enough to be safe on any shell. Anything else is dropped: the child
// re-reads it from NEXAED_PROJECT_NAME.
const SAFE_NAME = /^[\w][\w.\-]*$/;

function forwardArgv(argv: string[]): string[] {
  const kept: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]!;
    if (arg in OWN_VALUE_FLAGS) {
      i++;
      continue;
    }
    if (OWN_BOOL_FLAGS.has(arg)) continue;
    // Unrecognised flags belong to a newer version — forward them untouched.
    if (arg.startsWith("-") || SAFE_NAME.test(arg)) kept.push(arg);
  }
  return kept;
}

function configEnv(args: ReturnType<typeof parseArgs>): Record<string, string> {
  const set: Record<string, string | undefined> = {
    NEXAED_PROJECT_NAME: args.projectName,
    NEXAED_AUTH: args.auth,
    NEXAED_UI: args.ui,
    NEXAED_FEATURES: args.features?.join(","),
    NEXAED_EMAIL_TIER: args.emailTier,
    NEXAED_EMAIL_DOMAIN: args.emailDomain,
    NEXAED_API_KEY: args.apiKey,
    NEXAED_PM: args.pm,
    NEXAED_NO_INSTALL: args.noInstall ? "1" : undefined,
    NEXAED_GIT: args.git === undefined ? undefined : args.git ? "1" : "0",
  };
  const merged: Record<string, string> = {};
  for (const [k, v] of Object.entries(set)) if (v !== undefined) merged[k] = v;
  return merged;
}

async function guardStaleScaffold(argv: string[], args: ReturnType<typeof parseArgs>): Promise<void> {
  if (process.env.NEXAED_SKIP_UPDATE_CHECK === "1") return;
  const current = readCurrentVersion();
  const latest = await fetchLatestVersion();
  if (!latest || !isNewer(latest, current)) return;

  const { cmd, args: runnerArgs } = runnerForLatest(latest);
  const forwarded = forwardArgv(argv);
  const env = { ...process.env, ...configEnv(args), NEXAED_SKIP_UPDATE_CHECK: "1" };

  p.log.info(
    `You have create-nexaed-app ${current}, but ${latest} is the latest release — handing off to it…`,
  );

  // Windows package managers are .cmd shims, which Node can only launch through
  // a shell; every token on that command line is vetted above.
  const res =
    process.platform === "win32"
      ? spawnSync([cmd, ...runnerArgs, ...forwarded].join(" "), {
          stdio: "inherit",
          env,
          shell: true,
        })
      : spawnSync(cmd, [...runnerArgs, ...forwarded], { stdio: "inherit", env });

  if (res.error) {
    // The package manager itself could not be launched; fall back to the
    // manual instruction rather than scaffolding with a known-stale copy.
    p.log.warn(updateAvailableMessage(current, latest));
    process.exit(1);
  }
  process.exit(res.status ?? 1);
}

// `--pin <version>` keeps this exact version (for docs examples that must stay
// reproducible); everything else hands off when the package manager has resolved
// an old copy — see guardStaleScaffold.
async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const isInit = args.command === "init";

  // Non-init commands only get the lightweight after-the-fact notice.
  const updatePromise = isInit ? null : checkForUpdate();
  if (isInit && !args.pin) await guardStaleScaffold(argv, args);

  try {
    switch (args.command) {
      case "doctor":
        await runDoctor();
        break;
      case "upgrade":
        await runUpgrade();
        break;
      case "help":
        runHelp();
        break;
      case "telemetry":
        await runTelemetryCommand(args.telemetryValue);
        break;
      case "skill":
        await runSkill();
        break;
      default:
        await runInit(args);
        break;
    }
  } catch (err: any) {
    p.log.error(err?.message ?? String(err));
    // exitCode rather than process.exit(): forcing an exit while clack still
    // holds a pending handle aborts on Windows with a libuv assertion.
    process.exitCode = 1;
    return;
  }

  const updateMsg = await updatePromise;
  if (updateMsg) p.log.warn(updateMsg);
}

main();
