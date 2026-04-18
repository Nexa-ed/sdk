/* ─── Types ──────────────────────────────────────────────────────────────── */

export type Auth = "workos" | "clerk" | "nextauth" | "none";
export type Feature = "fileProcessing" | "payments" | "convex" | "emailProvisioning";
export type EmailTier = "tier-1-nexa" | "tier-2-stalwart" | "tier-3-google";
export type PM = "pnpm" | "npm" | "yarn" | "bun";
export type UiLibrary = "none" | "shadcn";

export interface BuilderState {
  name: string;
  auth: Auth;
  features: Feature[];
  emailTier: EmailTier;
  ui: UiLibrary;
  pm: PM;
  git: boolean;
}

export const DEFAULTS: BuilderState = {
  name: "my-school",
  auth: "clerk",
  features: [],
  emailTier: "tier-1-nexa",
  ui: "none",
  pm: "pnpm",
  git: true,
};

/* ─── Command builder ────────────────────────────────────────────────────── */

export function buildCommand(s: BuilderState): string {
  const safeName = s.name.trim() || "my-school";
  const hasEmail = s.features.includes("emailProvisioning");

  const base =
    s.pm === "pnpm"
      ? `pnpm create nexaed-app ${safeName}`
      : s.pm === "yarn"
      ? `yarn create nexaed-app ${safeName}`
      : s.pm === "bun"
      ? `bunx create-nexaed-app ${safeName}`
      : `npx create-nexaed-app ${safeName}`;

  const parts: string[] = [base];

  if (s.auth !== "none") parts.push(`--auth ${s.auth}`);
  if (s.features.length > 0) parts.push(`--features ${s.features.join(",")}`);
  if (hasEmail) parts.push(`--email-tier ${s.emailTier}`);
  if (s.ui === "shadcn") parts.push(`--ui shadcn`);
  if (s.pm !== "pnpm" && s.pm !== "npm") parts.push(`--pm ${s.pm}`);
  if (s.pm === "npm") parts.push(`--pm npm`);
  if (!s.git) parts.push(`--no-git`);

  return parts.join(" \\\n  ");
}

/* ─── State ↔ URL ────────────────────────────────────────────────────────── */

export function stateToParams(s: BuilderState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.name !== DEFAULTS.name) p.set("name", s.name);
  if (s.auth !== DEFAULTS.auth) p.set("auth", s.auth);
  if (s.features.length > 0) p.set("features", s.features.join(","));
  if (s.features.includes("emailProvisioning") && s.emailTier !== DEFAULTS.emailTier)
    p.set("emailTier", s.emailTier);
  if (s.ui !== DEFAULTS.ui) p.set("ui", s.ui);
  if (s.pm !== DEFAULTS.pm) p.set("pm", s.pm);
  if (!s.git) p.set("git", "false");
  return p;
}

export function paramsToState(params: URLSearchParams): BuilderState {
  const raw = {
    name: params.get("name") ?? DEFAULTS.name,
    auth: (params.get("auth") as Auth) ?? DEFAULTS.auth,
    features: (params.get("features")?.split(",").filter(Boolean) as Feature[]) ?? [],
    emailTier: (params.get("emailTier") as EmailTier) ?? DEFAULTS.emailTier,
    ui: (params.get("ui") as UiLibrary) ?? DEFAULTS.ui,
    pm: (params.get("pm") as PM) ?? DEFAULTS.pm,
  };
  const validAuth: Auth[] = ["workos", "clerk", "nextauth", "none"];
  const validFeatures: Feature[] = ["fileProcessing", "payments", "convex", "emailProvisioning"];
  const validTiers: EmailTier[] = ["tier-1-nexa", "tier-2-stalwart", "tier-3-google"];
  const validUIs: UiLibrary[] = ["none", "shadcn"];
  const validPMs: PM[] = ["pnpm", "npm", "yarn", "bun"];
  return {
    name: raw.name.slice(0, 60).replace(/[^a-z0-9_-]/gi, "-") || DEFAULTS.name,
    auth: validAuth.includes(raw.auth) ? raw.auth : DEFAULTS.auth,
    features: raw.features.filter((f) => validFeatures.includes(f)),
    emailTier: validTiers.includes(raw.emailTier) ? raw.emailTier : DEFAULTS.emailTier,
    ui: validUIs.includes(raw.ui) ? raw.ui : DEFAULTS.ui,
    pm: validPMs.includes(raw.pm) ? raw.pm : DEFAULTS.pm,
    git: params.get("git") !== "false",
  };
}
