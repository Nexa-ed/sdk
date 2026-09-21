# create-nexaed-app

## 0.3.0-beta.6

### Patch Changes

- Fix WorkOS scaffold: pin @workos-inc/authkit-nextjs ^4.3.0 and authkit-react ^0.16.0 (the old `^0.x.x` placeholder resolved to an ancient release), and switch the generated lib/nexa.ts from the removed `getUser` export to `withAuth`, which v4 actually provides.

## 0.3.0-beta.5

### Patch Changes

- Exclude @nexa-ed/\* from pnpm's minimumReleaseAge supply-chain gate in generated projects (pnpm-workspace.yaml now carries minimumReleaseAgeExclude), so a fresh install always resolves the newest SDK publish instead of silently pinning an older one. The update notice now names the cache-proof, version-pinned command instead of a global install.

## 0.3.0-beta.4

### Patch Changes

- Write pnpm-workspace.yaml with allowBuilds approvals (pnpm 11 ignores the package.json pnpm field, so fresh installs still exited 1), only run Convex codegen when CONVEX_DEPLOYMENT credentials exist (otherwise npx convex dev is listed as an explicit next step), and stop the update notifier from suggesting downgrades during prerelease.

## 0.3.0-beta.3

### Patch Changes

- Pre-approve package build scripts (pnpm.onlyBuiltDependencies) in generated package.json and treat a warning-only install as successful, so fresh `pnpm create nexaed-app` runs complete and auto-run Convex codegen instead of exiting 1 on ERR_PNPM_IGNORED_BUILDS.

## 0.3.0-beta.2

### Minor Changes

- 519e604: v0.3.0-beta.0 — What Changed Bug Fix WorkOS middleware was broken for every scaffolded app. The generated middleware.ts was missing redirectUri, causing the auth callback to fail silently. Added redirectUri: process.env.WORKOS_REDIRECT_URI — the env var was already being written to .env.local so no extra setup needed. --- New Features (CLI) Git opt-in - Interactive prompt asks "Initialize a git repository?" (default: yes) - --git / --no-git flags for CI/non-interactive mode - On success: runs git init → git add -A → initial commit - Graceful fallback warning if git isn't installed or commit fails Nexium Labs attribution Generated landing page footer now reads: © {year} {ProjectName} · Built with Nexa Ed — a product by Nexium Labs
- d27c97f: Add a `skill` command that installs a Claude Code skill (`.claude/skills/nexa-ed-sdk`) covering `createNexa`/`createRouteHandler` setup, every `NexaClient` module's real method signatures, the verified `@nexa-ed/react` component/hook list, and webhook/error handling — verified against SDK source rather than the (sometimes lagging) hosted docs. `init` now installs it automatically into every newly scaffolded app; run `create-nexaed-app skill` to add it to an existing app.
- fix: scaffolding with `--features convex` now writes `convex/schema.ts` (feature-gated Nexa schema fragments) and `convex/nexa.ts` (mounts `upsert*FromNexa` mutations/queries), then runs `convex codegen` after install so `api.nexa.*` exists out of the box. Previously no `convex/` source files were generated at all, so every Convex project shipped with an empty `api: {}` tree and `createFileCompleteHandler`/`createPaymentCompleteHandler` failed to typecheck at first start.

  fix: shadcn scaffolds no longer emit duplicate `background`/`foreground` keys in `tailwind.config.ts` (TS1117 on `tsc --noEmit` / `next build` in every generated shadcn project).

## 0.3.0-beta.0

### Minor Changes

- **Fix:** WorkOS middleware now includes `redirectUri: process.env.WORKOS_REDIRECT_URI` — previously omitted, which caused the callback redirect to fail on every WorkOS-authenticated app
- **New:** Git opt-in — interactive prompt asks "Initialize a git repository?" (default: yes); also exposed as `--git` / `--no-git` CLI flags. When enabled, runs `git init`, `git add -A`, and an initial commit after scaffolding
- **New:** Nexium Labs attribution in generated landing page footer — `© {year} {ProjectName} · Built with Nexa Ed — a product by Nexium Labs`

## 0.2.0-beta.6

### Minor Changes

- 290d72c: chore update

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
