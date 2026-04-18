export interface ParsedArgs {
  command: "init" | "doctor" | "upgrade" | "help" | "telemetry";
  projectName?: string;
  auth?: string;
  ui?: string;
  features?: string[];
  emailTier?: string;
  emailDomain?: string;
  apiKey?: string;
  noInstall: boolean;
  pm?: string;
  telemetryValue?: "on" | "off";
  git?: boolean;
}

const COMMANDS = new Set(["doctor", "upgrade", "help", "telemetry"]);

export function parseArgs(argv: string[]): ParsedArgs {
  const result: ParsedArgs = { command: "init", noInstall: false };
  let i = 0;

  // First positional arg: known command or project name
  if (i < argv.length && !argv[i]!.startsWith("--")) {
    const first = argv[i]!;
    if (COMMANDS.has(first)) {
      result.command = first as ParsedArgs["command"];
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
