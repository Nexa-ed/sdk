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
function dlxCommand(latest: string, argv: string[]): string | null {
  // Only safe to rebuild the command line when every arg is a simple token;
  // anything with shell metacharacters should not be re-quoted by us.
  if (!argv.every((a) => /^[A-Za-z0-9@/_.:,+-]+$/.test(a))) return null;
  const spec = `create-nexaed-app@${latest}`;
  const ua = process.env.npm_config_user_agent ?? "";
  const runner = ua.startsWith("pnpm/")
    ? `pnpm dlx ${spec}`
    : ua.startsWith("yarn/")
      ? `yarn dlx ${spec}`
      : ua.startsWith("bun/")
        ? `bunx ${spec}`
        : `npx --yes ${spec}`;
  return [runner, ...argv].join(" ");
}

async function guardStaleScaffold(argv: string[]): Promise<void> {
  if (process.env.NEXAED_SKIP_UPDATE_CHECK === "1") return;
  const current = readCurrentVersion();
  const latest = await fetchLatestVersion();
  if (!latest || !isNewer(latest, current)) return;

  const cmd = dlxCommand(latest, argv);
  if (cmd) {
    p.log.info(
      `You have create-nexaed-app ${current}, but ${latest} is the latest release — handing off to it…`,
    );
    const res = spawnSync(cmd, {
      stdio: "inherit",
      shell: true,
      env: { ...process.env, NEXAED_SKIP_UPDATE_CHECK: "1" },
    });
    process.exit(res.status ?? 1);
  }
  p.log.warn(updateAvailableMessage(current, latest));
}

async function main() {
  const argv = process.argv.slice(2);
  const args = parseArgs(argv);
  const isInit = args.command === "init";

  // Non-init commands only get the lightweight after-the-fact notice.
  const updatePromise = isInit ? null : checkForUpdate();
  if (isInit) await guardStaleScaffold(argv);

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
    process.exit(1);
  }

  const updateMsg = await updatePromise;
  if (updateMsg) p.log.warn(updateMsg);
}

main();
