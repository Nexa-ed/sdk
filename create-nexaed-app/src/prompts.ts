import * as p from "@clack/prompts";
import path from "node:path";

export type AuthProvider = "clerk" | "nextauth" | "none";

export interface ScaffoldOptions {
  projectName: string;
  projectDir: string;
  authProvider: AuthProvider;
  features: {
    fileProcessing: boolean;
    payments: boolean;
    convex: boolean;
  };
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
    "fileProcessing" | "payments" | "convex"
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
    ],
    required: false,
    initialValues: ["fileProcessing", "payments"],
  });
  if (p.isCancel(featureSet)) cancel();
  const selectedFeatures = featureSet as Array<
    "fileProcessing" | "payments" | "convex"
  >;

  // ── API key (optional) ───────────────────────────────────────────────────────
  const apiKey = await p.text({
    message: "Nexa API key (optional — you can add it to .env later):",
    placeholder: "nxk_live_… or leave blank",
  });
  if (p.isCancel(apiKey)) cancel();

  return {
    projectName,
    projectDir,
    authProvider: auth as AuthProvider,
    features: {
      fileProcessing: selectedFeatures.includes("fileProcessing"),
      payments:       selectedFeatures.includes("payments"),
      convex:         selectedFeatures.includes("convex"),
    },
    apiKey: ((apiKey as string) ?? "").trim(),
  };
}

function cancel(): never {
  p.cancel("Scaffolding cancelled.");
  process.exit(0);
}
