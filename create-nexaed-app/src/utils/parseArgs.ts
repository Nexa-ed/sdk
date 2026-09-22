export interface ParsedArgs {
  command: "init" | "doctor" | "upgrade" | "help" | "telemetry" | "skill";
  projectName?: string;
  auth?: string;
  ui?: string;
  features?: string[];
  emailTier?: string;
  emailDomain?: string;
  apiKey?: string;
  noInstall: boolean;
  pm?: string;
  pin?: string;
  telemetryValue?: "on" | "off";
  git?: boolean;
}

const COMMANDS = new Set(["doctor", "upgrade", "help", "telemetry", "skill"]);

// Every option also reads an env var, so a run with no flags at all is fully
// configurable (and the stale-version hand-off can pass the parent's parsed
// config to the child without putting values on a command line).
// Flags win over env so an explicit flag is never silently overridden.
function env(name: string): string | undefined {
  const v = process.env[name];
  return v === undefined || v === "" ? undefined : v;
}

function envFlag(name: string): boolean | undefined {
  const v = env(name)?.toLowerCase();
  if (v === undefined) return undefined;
  if (v === "1" || v === "true" || v === "yes") return true;
  if (v === "0" || v === "false" || v === "no") return false;
  return undefined;
}

function envList(name: string): string[] | undefined {
  const v = env(name);
  if (v === undefined) return undefined;
  return v.split(",").map((f) => f.trim()).filter(Boolean);
}

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = {
    command: "init",
    noInstall: envFlag("NEXAED_NO_INSTALL") ?? false,
    projectName: env("NEXAED_PROJECT_NAME"),
    auth: env("NEXAED_AUTH"),
    ui: env("NEXAED_UI"),
    features: envList("NEXAED_FEATURES"),
    emailTier: env("NEXAED_EMAIL_TIER"),
    emailDomain: env("NEXAED_EMAIL_DOMAIN"),
    apiKey: env("NEXAED_API_KEY"),
    pm: env("NEXAED_PM"),
    git: envFlag("NEXAED_GIT"),
  };
  let i = 0;

  // First positional arg: known command or project name
  if (i < argv.length && !argv[i]!.startsWith("--")) {
    const first = argv[i]!;
    if (COMMANDS.has(first)) {
      result.command = first as ParsedArgs["command"];
      result.projectName = undefined;
      i++;
      // nexaed telemetry [on|off]
      if (result.command === "telemetry" && i < argv.length && !argv[i]!.startsWith("--")) {
        const val = argv[i];
        if (val === "on" || val === "off") {
          result.telemetryValue = val;
          i++;
        }
      }
    } else {
      result.projectName = first;
      i++;
    }
  }

  // Flags
  while (i < argv.length) {
    const arg = argv[i]!;
    switch (arg) {
      case "--auth":
        result.auth = argv[++i];
        break;
      case "--ui":
        result.ui = argv[++i];
        break;
      case "--features":
        result.features = (argv[++i] ?? "")
          .split(",")
          .map((f) => f.trim())
          .filter(Boolean);
        break;
      case "--email-tier":
        result.emailTier = argv[++i];
        break;
      case "--email-domain":
        result.emailDomain = argv[++i];
        break;
      case "--api-key":
        result.apiKey = argv[++i];
        break;
      case "--no-install":
        result.noInstall = true;
        break;
      case "--pm":
        result.pm = argv[++i];
        break;
      case "--pin":
        result.pin = argv[++i];
        break;
      case "--git":
        result.git = true;
        break;
      case "--no-git":
        result.git = false;
        break;
    }
    i++;
  }

  return result;
}
