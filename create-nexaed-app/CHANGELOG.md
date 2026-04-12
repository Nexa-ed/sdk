# create-nexaed-app

## 0.2.0-beta.5

### Minor Changes

- fc4f679: added in workos and patched global.css bugs accordingly

### Patch Changes

- 9332750: all round update
- e03965c: Add shadcn/ui library option (--ui shadcn|none), auth-aware middleware.ts generation, dark-mode-first scaffold with next-themes and a ThemeToggle component on the navbar. The generated app's design tokens
- 95b2dd2: made some adjustments to the cli
- 890f1c9: patches to the packages for easier flow and maintainablility

## 0.2.0-beta.4

### Patch Changes

- 53a8a7b: Add CLI command router, non-interactive mode, doctor, upgrade, and telemetry

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

## 0.2.0

### Minor Changes

#### Interactive CLI

- `create-nexaed-app` — interactive CLI scaffolder for bootstrapping a new Nexa-powered school app
- Uses `@clack/prompts` for a clean, guided setup experience
- Prompts: project name, framework (Next.js), Convex project URL, Clerk keys, email tier, domain

#### Templates

- `next-convex` — Next.js + Convex starter template with `@nexa-ed/next`, `@nexa-ed/react`, and `@nexa-ed/convex` pre-wired
- Template includes: `createNexa()` config, `[...nexa]/route.ts` catch-all handler, `NexaProvider` in layout, and example Convex schema spread

#### Scaffold Engine

- `scaffold(projectName, template, answers)` — copies template, replaces env placeholders, and installs dependencies with the detected package manager (npm / pnpm / yarn / bun)

---

## 0.2.0-beta.2

### Patch Changes

- 8adccda: patch added readme docs

## 0.2.0-beta.1

### Minor Changes

- 6a67afc: from the sdk list

## 0.2.0-beta.0

### Minor Changes

- 3997bcf: initital package
