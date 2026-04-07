import fs from "fs-extra";
import path from "node:path";
import os from "node:os";
import * as p from "@clack/prompts";

const CONFIG_PATH = path.join(os.homedir(), ".nexaed", "config.json");

interface NexaedConfig {
  telemetry?: boolean;
  askedAt?: string;
}

async function readConfig(): Promise<NexaedConfig> {
  try {
    return await fs.readJson(CONFIG_PATH);
  } catch {
    return {};
  }
}

async function writeConfig(config: NexaedConfig): Promise<void> {
  await fs.ensureDir(path.dirname(CONFIG_PATH));
  await fs.writeJson(CONFIG_PATH, config, { spaces: 2 });
}

export async function handleTelemetryConsent(event: object): Promise<void> {
  const config = await readConfig();

  if (config.askedAt === undefined) {
    // Non-interactive (CI, piped input) — skip prompt, defer until first interactive run
    if (!process.stdin.isTTY) return;

    // First interactive run — ask once
    const answer = await p.confirm({
      message:
        'Help improve nexaed by sending anonymous usage data? (opt-out anytime: "nexaed telemetry off")',
      initialValue: true,
    });
    const telemetry = p.isCancel(answer) ? false : (answer as boolean);
    await writeConfig({
      telemetry,
      askedAt: new Date().toISOString().slice(0, 10),
    });
    if (!telemetry) return;
  } else if (!config.telemetry) {
    return;
  }

  // Fire and forget — never blocks or throws
  fetch("https://nexa-ed.com/api/telemetry", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(event),
    signal: AbortSignal.timeout(3000),
  }).catch(() => {});
}

export async function runTelemetryCommand(
  value?: "on" | "off",
): Promise<void> {
  const config = await readConfig();

  if (!value) {
    const status =
      config.askedAt === undefined
        ? "not yet set"
        : config.telemetry
          ? "on"
          : "off";
    p.log.info(`Telemetry is currently: ${status}`);
    p.log.info(
      'Use "nexaed telemetry on" or "nexaed telemetry off" to change.',
    );
    return;
  }

  config.telemetry = value === "on";
  config.askedAt = new Date().toISOString().slice(0, 10);
  await writeConfig(config);
  p.log.success(`Telemetry turned ${value}.`);
}
