---
"create-nexaed-app": patch
---

Add CLI command router, non-interactive mode, doctor, upgrade, and telemetry

**Non-interactive / CI mode**
All prompts can now be bypassed with flags so `create-nexaed-app` works in
pipelines without a TTY. Supported flags: `--auth`, `--features`,
`--email-tier`, `--email-domain`, `--api-key`, `--no-install`, `--pm`.
When stdin is not a TTY, the fast path builds scaffold options directly
without invoking clack, preventing TTY init errors in CI.

**Command router**
`create-nexaed-app <command>` now dispatches to subcommands:
- `init` (default) — scaffold a new school app
- `doctor` — validate an existing installation
- `upgrade` — upgrade all `@nexa-ed/*` dependencies to `@latest`
- `telemetry on|off` — manage telemetry preference
- `help` — print usage

**`doctor` command**
Runs 5 checks against an existing school app: required env vars present,
`@nexa-ed/*` packages installed, catch-all API route exists, SDK version
vs npm latest, and API key reachability against the Nexa platform.

**`upgrade` command**
Reads `package.json` in the current directory, finds all `@nexa-ed/*`
dependencies, and runs the detected package manager's add command with
`@latest` on each.

**Opt-in telemetry**
Asks once on the first interactive run and saves the preference to
`~/.nexaed/config.json`. Skipped entirely in CI (non-TTY). Fires a
fire-and-forget POST — never blocks or throws. Toggle with
`nexaed telemetry on` / `nexaed telemetry off`.

**Update notifier**
Checks npm for a newer version of `create-nexaed-app` in the background
at startup and prints a one-line notice after the outro if one is found.
