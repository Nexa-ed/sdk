import type { BuilderState } from "../types";
import { SectionHeader } from "../primitives";

interface PreviewSectionProps {
  state: BuilderState;
}

export function PreviewSection({ state }: PreviewSectionProps) {
  return (
    <section>
      <SectionHeader label="What Gets Generated" />
      <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background">
        <div className="flex items-center gap-1.5 border-b border-fd-border bg-fd-card/40 px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-red-500/70" />
          <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
          <span className="h-2 w-2 rounded-full bg-nexa-primary/70" />
          <span className="ml-2 font-mono text-[10px] text-fd-muted-foreground">
            {state.name.trim() || "my-school"}/
          </span>
        </div>
        <pre className="overflow-x-auto px-5 py-4 font-mono text-xs leading-relaxed text-fd-muted-foreground">
          <FileTree state={state} />
        </pre>
      </div>
    </section>
  );
}

/* ─── File tree ──────────────────────────────────────────────────────────── */

function FileTree({ state }: { state: BuilderState }) {
  const name = state.name.trim() || "my-school";
  const hasFile    = state.features.includes("fileProcessing");
  const hasPay     = state.features.includes("payments");
  const hasConvex  = state.features.includes("convex");
  const hasEmail   = state.features.includes("emailProvisioning");
  const hasWorkOS  = state.auth === "workos";
  const hasClerk   = state.auth === "clerk";
  const hasNextAuth = state.auth === "nextauth";
  const hasShadcn  = state.ui === "shadcn";

  const authLabel = hasWorkOS ? " (WorkOS)" : hasClerk ? " (Clerk)" : hasNextAuth ? " (NextAuth)" : "";

  const lines = [
    `<span class="text-fd-foreground font-semibold">${name}/</span>`,
    `├── app/`,
    `│   ├── api/nexa/[...nexaed]/`,
    `│   │   └── <span class="text-nexa-primary">route.ts</span>        ← webhook handler`,
    hasFile   ? `│   ├── api/nexa/upload/route.ts  ← file upload endpoint` : "",
    hasPay    ? `│   ├── api/nexa/payments/route.ts ← payment forwarding` : "",
    hasEmail  ? `│   ├── api/nexa/email/route.ts   ← email provisioning` : "",
    hasWorkOS ? `│   ├── callback/route.ts          ← WorkOS auth callback` : "",
    `│   ├── dashboard/`,
    `│   │   └── <span class="text-nexa-primary">page.tsx</span>        ← main dashboard`,
    `│   ├── layout.tsx`,
    `│   └── providers.tsx`,
    `├── lib/`,
    `│   ├── <span class="text-nexa-primary">nexa.ts</span>             ← SDK client${authLabel}`,
    hasShadcn  ? `│   └── <span class="text-nexa-primary">utils.ts</span>             ← cn() helper` : "",
    hasConvex  ? `│   └── convex/schema.ts        ← Nexa schema fragments` : "",
    state.auth !== "none" ? `├── <span class="text-nexa-primary">middleware.ts</span>             ← auth route protection` : "",
    hasShadcn  ? `├── <span class="text-nexa-primary">components.json</span>          ← shadcn/ui config` : "",
    `├── .env.local                ← NEXA_API_KEY, NEXA_WEBHOOK_SECRET`,
    `├── .env.example`,
    `├── package.json`,
    `├── tsconfig.json`,
    state.git  ? `└── <span class="opacity-40">.git/</span>                     ← initialized` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return <span dangerouslySetInnerHTML={{ __html: lines }} />;
}
