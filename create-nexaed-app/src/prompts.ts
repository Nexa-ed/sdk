import * as p from "@clack/prompts";
import { readdir } from "node:fs/promises";
import path from "node:path";

export type AuthProvider = "workos" | "clerk" | "nextauth" | "none";

export type EmailTier = "tier-1-nexa" | "tier-2-stalwart" | "tier-3-google";

export type UiLibrary = "shadcn" | "none";

export interface ScaffoldOptions {
  projectName: string;
  projectDir: string;
  authProvider: AuthProvider;
  uiLibrary: UiLibrary;
  features: {
    fileProcessing: boolean;
    payments: boolean;
    convex: boolean;
    emailProvisioning: boolean;
  };
  emailTier?: EmailTier;
  emailDomain?: string;
  apiKey: string;
  git: boolean;
}

export interface Prefill {
  auth?: string;
  ui?: string;
  features?: string[];
  emailTier?: string;
  emailDomain?: string;
  apiKey?: string;
  git?: boolean;
}

const VALID_AUTH = new Set<string>(["workos", "clerk", "nextauth", "none"]);
const VALID_TIERS = new Set<string>([
  "tier-1-nexa",
  "tier-2-stalwart",
  "tier-3-google",
]);
const VALID_FEATURES = new Set<string>([
  "fileProcessing",
  "payments",
  "convex",
  "emailProvisioning",
]);
const VALID_UI = new Set<string>(["shadcn", "none"]);

async function isNonEmptyDir(dir: string): Promise<boolean> {
  try {
    return (await readdir(dir)).length > 0;
  } catch {
    return false;
  }
}

/**
 * Never dead-end a re-run: a previous scaffold (or any folder in the way) sends
 * the user to a fresh name interactively, and gives a copy-pasteable instruction
 * when nobody is at the keyboard. Existing files are never touched.
 */
async function resolveTarget(name: string): Promise<{ projectName: string; projectDir: string }> {
  let current = name;
  for (;;) {
    const dir = path.resolve(process.cwd(), current);
    if (!(await isNonEmptyDir(dir))) return { projectName: current, projectDir: dir };

    if (!process.stdin.isTTY) {
      throw new Error(
        `Directory "${current}" already exists and is not empty, so nothing was written.\n` +
          `  Re-run under a new name, e.g. create-nexaed-app ${current}-2\n` +
          `  Or delete the old folder first and run the same command again.`,
      );
    }

    const answer = await p.text({
      message: `"${current}" already exists and is not empty — its files are left untouched. Choose a new project name:`,
      initialValue: `${current}-2`,
      validate: (v) => (v.trim().length === 0 ? "Project name is required." : undefined),
    });
    if (p.isCancel(answer)) cancel();
    current = (answer as string).trim();
  }
}

/**
 * Build ScaffoldOptions directly from prefill without any interactive prompts.
 * Used in non-TTY environments (CI) when all required values are supplied via flags.
 * Unknown values never abort the run: they fall back to the default and say so,
 * so a typo costs a warning rather than the whole scaffold.
 */
function buildFromPrefill(nameArg: string, prefill: Prefill): ScaffoldOptions {
  const projectName = nameArg;

  const authProvider =
    prefill.auth && VALID_AUTH.has(prefill.auth)
      ? (prefill.auth as AuthProvider)
      : "none";
  if (prefill.auth && !VALID_AUTH.has(prefill.auth)) {
    console.warn(
      `  ! Unknown auth provider '${prefill.auth}' — using 'none'. Valid: ${[...VALID_AUTH].join(", ")}.`,
    );
  }

  type FeatureKey = "fileProcessing" | "payments" | "convex" | "emailProvisioning";
  const requested = prefill.features ?? [];
  const selectedFeatures = requested.filter((f): f is FeatureKey => VALID_FEATURES.has(f));
  const rejected = requested.filter((f) => !VALID_FEATURES.has(f));
  if (rejected.length) {
    console.warn(
      `  ! Skipping unknown feature(s): ${rejected.join(", ")} — kept: ${selectedFeatures.join(", ") || "none"}. Valid: ${[...VALID_FEATURES].join(", ")}.`,
    );
  }

  const emailTier =
    selectedFeatures.includes("emailProvisioning") &&
    prefill.emailTier &&
    VALID_TIERS.has(prefill.emailTier)
      ? (prefill.emailTier as EmailTier)
      : undefined;
  if (selectedFeatures.includes("emailProvisioning") && prefill.emailTier && !emailTier) {
    console.warn(
      `  ! Unknown email tier '${prefill.emailTier}' — skipping it. Valid: ${[...VALID_TIERS].join(", ")}.`,
    );
  }
  if (!selectedFeatures.includes("emailProvisioning") && (prefill.emailTier || prefill.emailDomain)) {
    console.warn(
      `  ! --email-tier/--email-domain need the 'emailProvisioning' feature — add it to --features or they are ignored.`,
    );
  }

  const emailDomain =
    selectedFeatures.includes("emailProvisioning")
      ? (prefill.emailDomain ??
          (emailTier === "tier-1-nexa" ? `${projectName}.nexa-ed.com` : ""))
      : undefined;

  const uiLibrary: UiLibrary =
    prefill.ui && VALID_UI.has(prefill.ui) ? (prefill.ui as UiLibrary) : "none";
  if (prefill.ui && !VALID_UI.has(prefill.ui)) {
    console.warn(`  ! Unknown UI library '${prefill.ui}' — using 'none'. Valid: ${[...VALID_UI].join(", ")}.`);
  }

  return {
    projectName,
    projectDir: path.resolve(process.cwd(), projectName),
    authProvider,
    uiLibrary,
    features: {
      fileProcessing: selectedFeatures.includes("fileProcessing"),
      payments: selectedFeatures.includes("payments"),
      convex: selectedFeatures.includes("convex"),
      emailProvisioning: selectedFeatures.includes("emailProvisioning"),
    },
    emailTier,
    emailDomain,
    apiKey: prefill.apiKey ?? "",
    git: prefill.git !== false,
  };
}

export async function runPrompts(
  nameArg?: string,
  prefill: Prefill = {},
): Promise<ScaffoldOptions> {
  // Supplying email settings is intent: don't make the user also remember that
  // the feature has to be named, and don't silently discard what they asked for.
  if (
    prefill.features &&
    (prefill.emailTier || prefill.emailDomain) &&
    !prefill.features.includes("emailProvisioning")
  ) {
    prefill.features = [...prefill.features, "emailProvisioning"];
    console.log(
      "  · Enabling the emailProvisioning feature because email settings were given.",
    );
  }

  // Non-interactive fast path: skip all clack I/O when stdin is not a TTY
  // and a project name is available.
  if (!process.stdin.isTTY && nameArg) {
    const target = await resolveTarget(nameArg);
    return { ...buildFromPrefill(target.projectName, prefill), ...target };
  }

  p.intro("create-nexaed-app — scaffold a Nexa-connected school app");

  // ── Project name ─────────────────────────────────────────────────────────────
  let projectName: string;
  if (nameArg) {
    projectName = nameArg;
    p.log.info(`Project name: ${projectName}`);
  } else {
    const answer = await p.text({
      message: "What is your school app called?",
      placeholder: "my-school",
      validate: (v) =>
        v.trim().length === 0 ? "Project name is required." : undefined,
    });
    if (p.isCancel(answer)) cancel();
    projectName = (answer as string).trim();
  }

  const target = await resolveTarget(projectName);
  projectName = target.projectName;
  const projectDir = target.projectDir;

  // ── Auth provider ─────────────────────────────────────────────────────────────
  let authProvider: AuthProvider;
  const prefillAuth =
    prefill.auth && VALID_AUTH.has(prefill.auth)
      ? (prefill.auth as AuthProvider)
      : undefined;

  if (prefillAuth) {
    authProvider = prefillAuth;
    p.log.step(`Auth provider: ${authProvider}`);
  } else {
    const auth = await p.select<AuthProvider>({
      message: "Which auth provider does your app use?",
      options: [
        { value: "workos",   label: "WorkOS    — recommended: enterprise SSO, SCIM, 1M MAU free" },
        { value: "clerk",    label: "Clerk     — zero config, great DX" },
        { value: "nextauth", label: "NextAuth  — bring your own session" },
        { value: "none",     label: "None      — I'll add auth myself" },
      ],
    });
    if (p.isCancel(auth)) cancel();
    authProvider = auth as AuthProvider;
  }

  // ── Features ──────────────────────────────────────────────────────────────────
  type FeatureKey = "fileProcessing" | "payments" | "convex" | "emailProvisioning";
  let selectedFeatures: FeatureKey[];
  const prefillFeatures =
    prefill.features && prefill.features.every((f) => VALID_FEATURES.has(f))
      ? (prefill.features as FeatureKey[])
      : undefined;

  if (prefillFeatures) {
    selectedFeatures = prefillFeatures;
    p.log.step(
      `Features: ${selectedFeatures.length ? selectedFeatures.join(", ") : "none"}`,
    );
  } else {
    const featureSet = await p.multiselect<FeatureKey>({
      message: "Which Nexa features do you need?",
      options: [
        {
          value: "fileProcessing",
          label: "File processing + OCR results",
          hint: "Upload PDFs, extract student records",
        },
        {
          value: "payments",
          label: "Payments",
          hint: "Paystack-powered enrollment fees",
        },
        {
          value: "convex",
          label: "Convex integration",
          hint: "Pre-built schema + mutations for Convex backends",
        },
        {
          value: "emailProvisioning",
          label: "Student email provisioning",
          hint: "Create and manage student email accounts",
        },
      ],
      required: false,
      initialValues: ["fileProcessing", "payments"],
    });
    if (p.isCancel(featureSet)) cancel();
    selectedFeatures = featureSet as FeatureKey[];
  }

  // ── UI library ────────────────────────────────────────────────────────────────
  let uiLibrary: UiLibrary;
  const prefillUi =
    prefill.ui && VALID_UI.has(prefill.ui) ? (prefill.ui as UiLibrary) : undefined;

  if (prefillUi) {
    uiLibrary = prefillUi;
    p.log.step(`UI library: ${uiLibrary}`);
  } else {
    const ui = await p.select<UiLibrary>({
      message: "Which UI library do you want?",
      options: [
        {
          value: "none",
          label: "None       — plain Tailwind",
          hint: "Use @nexa-ed/react components as-is",
        },
        {
          value: "shadcn",
          label: "shadcn/ui  — recommended",
          hint: "Accessible components, copy-paste pattern",
        },
      ],
    });
    if (p.isCancel(ui)) cancel();
    uiLibrary = ui as UiLibrary;
  }

  // ── Git initialization ────────────────────────────────────────────────────────
  let git: boolean;
  if (prefill.git !== undefined) {
    git = prefill.git;
    p.log.step(`Git: ${git ? "yes" : "no"}`);
  } else {
    const gitAnswer = await p.confirm({
      message: "Initialize a git repository?",
      initialValue: true,
    });
    if (p.isCancel(gitAnswer)) cancel();
    git = gitAnswer as boolean;
  }

  // ── Email provisioning config ─────────────────────────────────────────────────
  let emailTier: EmailTier | undefined;
  let emailDomain: string | undefined;

  if (selectedFeatures.includes("emailProvisioning")) {
    const prefillTier =
      prefill.emailTier && VALID_TIERS.has(prefill.emailTier)
        ? (prefill.emailTier as EmailTier)
        : undefined;

    if (prefillTier) {
      emailTier = prefillTier;
      p.log.step(`Email tier: ${emailTier}`);
    } else {
      const tier = await p.select<EmailTier>({
        message: "Which email tier will you use?",
        options: [
          {
            value: "tier-1-nexa",
            label: "Tier 1 — Nexa subdomain  (yourschool.nexa-ed.com)",
            hint: "No domain needed",
          },
          {
            value: "tier-2-stalwart",
            label: "Tier 2 — Custom domain    (Stalwart)",
            hint: "Requires domain verification",
          },
          {
            value: "tier-3-google",
            label: "Tier 3 — Google Workspace",
            hint: "Requires GWS credentials + domain",
          },
        ],
      });
      if (p.isCancel(tier)) cancel();
      emailTier = tier as EmailTier;
    }

    if (prefill.emailDomain) {
      emailDomain = prefill.emailDomain;
      p.log.step(`Email domain: ${emailDomain}`);
    } else {
      const defaultDomain =
        emailTier === "tier-1-nexa" ? `${projectName}.nexa-ed.com` : "";
      const domain = await p.text({
        message: "Email domain:",
        placeholder: defaultDomain || "loretto.edu.ng",
        initialValue: defaultDomain,
        validate: (v) =>
          v.trim().length === 0 ? "Domain is required." : undefined,
      });
      if (p.isCancel(domain)) cancel();
      emailDomain = (domain as string).trim();
    }
  }

  // ── API key (optional) ────────────────────────────────────────────────────────
  let apiKey: string;
  if (prefill.apiKey !== undefined) {
    apiKey = prefill.apiKey;
    if (apiKey) p.log.step(`API key: ${apiKey.slice(0, 12)}…`);
  } else {
    const answer = await p.text({
      message: "Nexa API key (optional — you can add it to .env later):",
      placeholder: "nxa_live_… or leave blank",
    });
    if (p.isCancel(answer)) cancel();
    apiKey = ((answer as string) ?? "").trim();
  }

  return {
    projectName,
    projectDir,
    authProvider,
    uiLibrary,
    features: {
      fileProcessing: selectedFeatures.includes("fileProcessing"),
      payments: selectedFeatures.includes("payments"),
      convex: selectedFeatures.includes("convex"),
      emailProvisioning: selectedFeatures.includes("emailProvisioning"),
    },
    emailTier,
    emailDomain,
    apiKey,
    git,
  };
}

function cancel(): never {
  p.cancel("Scaffolding cancelled.");
  process.exit(0);
}
