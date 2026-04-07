import * as p from "@clack/prompts";
import fs from "fs-extra";
import path from "node:path";

interface CheckResult {
  label: string;
  ok: boolean;
  hint?: string;
}

async function checkEnvVars(cwd: string): Promise<CheckResult> {
  const envPath = path.join(cwd, ".env.local");
  if (!(await fs.pathExists(envPath))) {
    return {
      label: "Env vars (.env.local)",
      ok: false,
      hint: ".env.local not found — copy .env.example and fill it in",
    };
  }
  const content = await fs.readFile(envPath, "utf8");
  const required = ["NEXA_API_KEY", "NEXA_WEBHOOK_SECRET"];
  const missing = required.filter((key) => {
    const match = content.match(new RegExp(`^${key}=(.+)$`, "m"));
    return !match || !match[1]?.trim();
  });
  if (missing.length > 0) {
    return {
      label: "Env vars (.env.local)",
      ok: false,
      hint: `Missing or empty: ${missing.join(", ")}`,
    };
  }
  return { label: "Env vars (.env.local)", ok: true };
}

async function checkDepsInstalled(cwd: string): Promise<CheckResult> {
  const required = ["@nexa-ed/react", "@nexa-ed/next"];
  const missing = required.filter(
    (dep) => !fs.pathExistsSync(path.join(cwd, "node_modules", dep)),
  );
  if (missing.length > 0) {
    return {
      label: "SDK packages installed",
      ok: false,
      hint: `Missing: ${missing.join(", ")} — run pnpm install`,
    };
  }
  return { label: "SDK packages installed", ok: true };
}

async function checkWebhookRoute(cwd: string): Promise<CheckResult> {
  const routePath = path.join(
    cwd,
    "app",
    "api",
    "nexa",
    "[...nexaed]",
    "route.ts",
  );
  const ok = await fs.pathExists(routePath);
  return {
    label: "Nexa catch-all route",
    ok,
    hint: ok
      ? undefined
      : "app/api/nexa/[...nexaed]/route.ts not found — was it deleted?",
  };
}

async function checkSdkVersion(cwd: string): Promise<CheckResult> {
  try {
    const pkgPath = path.join(
      cwd,
      "node_modules",
      "@nexa-ed",
      "react",
      "package.json",
    );
    if (!(await fs.pathExists(pkgPath))) {
      return {
        label: "SDK version",
        ok: false,
        hint: "@nexa-ed/react not installed — run pnpm install",
      };
    }
    const { version: installed } = (await fs.readJson(pkgPath)) as {
      version: string;
    };
    const res = await fetch(
      "https://registry.npmjs.org/@nexa-ed/react/latest",
      { signal: AbortSignal.timeout(3000) },
    );
    if (!res.ok) {
      return {
        label: `SDK version (${installed})`,
        ok: true,
        hint: "Couldn't check npm for latest",
      };
    }
    const { version: latest } = (await res.json()) as { version: string };
    if (installed === latest) {
      return { label: `SDK version (${installed})`, ok: true };
    }
    return {
      label: "SDK version",
      ok: false,
      hint: `${installed} installed, ${latest} available — run: create-nexaed-app upgrade`,
    };
  } catch {
    return {
      label: "SDK version",
      ok: true,
      hint: "Couldn't reach npm (offline?)",
    };
  }
}

async function checkApiKeyReachable(
  cwd: string,
): Promise<CheckResult | null> {
  const envPath = path.join(cwd, ".env.local");
  if (!(await fs.pathExists(envPath))) return null;
  const content = await fs.readFile(envPath, "utf8");
  const match = content.match(/^NEXA_API_KEY=(.+)$/m);
  if (!match || !match[1]?.trim()) return null;
  const apiKey = match[1].trim();
  try {
    const res = await fetch("https://nexa-ed.com/api/ping", {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) return { label: "Nexa API key valid", ok: true };
    return {
      label: "Nexa API key valid",
      ok: false,
      hint: `Got HTTP ${res.status} — double-check NEXA_API_KEY`,
    };
  } catch {
    return {
      label: "Nexa API reachable",
      ok: false,
      hint: "Network error — check your connection",
    };
  }
}

export async function runDoctor(): Promise<void> {
  const cwd = process.cwd();
  p.intro("nexaed doctor — checking your project");

  const spinner = p.spinner();
  spinner.start("Running checks…");

  const checks: CheckResult[] = [];
  checks.push(await checkEnvVars(cwd));
  checks.push(await checkDepsInstalled(cwd));
  checks.push(await checkWebhookRoute(cwd));
  checks.push(await checkSdkVersion(cwd));
  const apiCheck = await checkApiKeyReachable(cwd);
  if (apiCheck) checks.push(apiCheck);

  spinner.stop("Checks complete.");

  for (const check of checks) {
    if (check.ok) {
      p.log.success(
        check.label + (check.hint ? ` — ${check.hint}` : ""),
      );
    } else {
      p.log.error(
        `${check.label}${check.hint ? `\n  → ${check.hint}` : ""}`,
      );
    }
  }

  const allOk = checks.every((c) => c.ok);
  p.outro(allOk ? "All checks passed." : "Some checks failed — see above.");
  if (!allOk) process.exit(1);
}
