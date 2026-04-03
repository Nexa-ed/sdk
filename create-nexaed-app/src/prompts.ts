import * as p from "@clack/prompts";
import path from "node:path";

export type AuthProvider = "clerk" | "nextauth" | "none";

export type EmailTier = "tier-1-nexa" | "tier-2-stalwart" | "tier-3-google";

export interface ScaffoldOptions {
  projectName: string;
  projectDir: string;
  authProvider: AuthProvider;
  features: {
    fileProcessing: boolean;
    payments: boolean;
    convex: boolean;
    emailProvisioning: boolean;
  };
  emailTier?: EmailTier;
  emailDomain?: string;
  apiKey: string;
}

export async function runPrompts(nameArg?: string): Promise<ScaffoldOptions> {
  p.intro("create-nexaed-app — scaffold a Nexa-connected school app");

  // ── Project name ────────────────────────────────────────────────────────────
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

  const projectDir = path.resolve(process.cwd(), projectName);

  // ── Auth provider ────────────────────────────────────────────────────────────
  const auth = await p.select<AuthProvider>({
    message: "Which auth provider does your app use?",
    options: [
      { value: "clerk",    label: "Clerk     — recommended, zero config" },
      { value: "nextauth", label: "NextAuth  — bring your own session" },
      { value: "none",     label: "None      — I'll add auth myself" },
    ],
  });
  if (p.isCancel(auth)) cancel();

  // ── Features ─────────────────────────────────────────────────────────────────
  const featureSet = await p.multiselect<
    "fileProcessing" | "payments" | "convex" | "emailProvisioning"
  >({
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
  const selectedFeatures = featureSet as Array<
    "fileProcessing" | "payments" | "convex" | "emailProvisioning"
  >;

  // ── Email provisioning config ─────────────────────────────────────────────
  let emailTier: EmailTier | undefined;
  let emailDomain: string | undefined;

  if (selectedFeatures.includes("emailProvisioning")) {
    const tier = await p.select<EmailTier>({
      message: "Which email tier will you use?",
      options: [
        { value: "tier-1-nexa",     label: "Tier 1 — Nexa subdomain  (yourschool.nexa-ed.com)", hint: "No domain needed" },
        { value: "tier-2-stalwart", label: "Tier 2 — Custom domain    (Stalwart)",               hint: "Requires domain verification" },
        { value: "tier-3-google",   label: "Tier 3 — Google Workspace",                          hint: "Requires GWS credentials + domain" },
      ],
    });
    if (p.isCancel(tier)) cancel();
    emailTier = tier as EmailTier;

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

  // ── API key (optional) ───────────────────────────────────────────────────────
  const apiKey = await p.text({
    message: "Nexa API key (optional — you can add it to .env later):",
    placeholder: "nxa_live_… or leave blank",
  });
  if (p.isCancel(apiKey)) cancel();

  return {
    projectName,
    projectDir,
    authProvider: auth as AuthProvider,
    features: {
      fileProcessing:    selectedFeatures.includes("fileProcessing"),
      payments:          selectedFeatures.includes("payments"),
      convex:            selectedFeatures.includes("convex"),
      emailProvisioning: selectedFeatures.includes("emailProvisioning"),
    },
    emailTier,
    emailDomain,
    apiKey: ((apiKey as string) ?? "").trim(),
  };
}

function cancel(): never {
  p.cancel("Scaffolding cancelled.");
  process.exit(0);
}
