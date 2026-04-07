import pc from "picocolors";

export function runHelp(): void {
  const lines = [
    "",
    pc.bold("nexaed") + " — Nexa Education Platform CLI",
    "",
    pc.bold("Usage:"),
    "  create-nexaed-app [command] [options]",
    "",
    pc.bold("Commands:"),
    `  ${pc.cyan("init")} [name]            Scaffold a new Nexa-connected school app ${pc.dim("(default)")}`,
    `  ${pc.cyan("doctor")}                 Check an existing app for config issues`,
    `  ${pc.cyan("upgrade")}                Upgrade @nexa-ed/* packages to latest`,
    `  ${pc.cyan("telemetry")} [on|off]     View or change telemetry preference`,
    `  ${pc.cyan("help")}                   Show this help`,
    "",
    pc.bold("Flags (for init):"),
    "  --auth <provider>      clerk | nextauth | none",
    "  --features <list>      Comma-separated: fileProcessing, payments, convex, emailProvisioning",
    "  --email-tier <tier>    tier-1-nexa | tier-2-stalwart | tier-3-google",
    "  --email-domain <host>  e.g. myschool.nexa-ed.com",
    "  --api-key <key>        Nexa API key (nxa_live_…)",
    "  --no-install           Skip dependency install after scaffolding",
    "  --pm <manager>         pnpm | yarn | npm  (auto-detected by default)",
    "",
    pc.bold("Examples:"),
    pc.dim("  # Interactive"),
    "  create-nexaed-app my-school",
    "",
    pc.dim("  # Fully non-interactive (CI)"),
    "  create-nexaed-app my-school --auth clerk --features convex,payments --no-install",
    "",
    pc.dim("  # Check an existing project"),
    "  cd my-school && create-nexaed-app doctor",
    "",
    `  Docs: ${pc.underline("https://docs.nexa-ed.com")}`,
    "",
  ];

  console.log(lines.join("\n"));
}
