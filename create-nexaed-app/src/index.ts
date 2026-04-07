#!/usr/bin/env node
import * as p from "@clack/prompts";
import { parseArgs } from "./utils/parseArgs";
import { runInit } from "./commands/init";
import { runDoctor } from "./commands/doctor";
import { runUpgrade } from "./commands/upgrade";
import { runHelp } from "./commands/help";
import { checkForUpdate } from "./utils/updateNotifier";
import { runTelemetryCommand } from "./utils/telemetry";

async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Fire update check in background — never blocks prompts
  const updatePromise = checkForUpdate();

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
      default:
        await runInit(args);
        break;
    }
  } catch (err: any) {
    p.log.error(err?.message ?? String(err));
    process.exit(1);
  }

  // Print update notice after everything else
  const updateMsg = await updatePromise;
  if (updateMsg) p.log.warn(updateMsg);
}

main();
