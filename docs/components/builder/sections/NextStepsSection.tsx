import Link from "next/link";
import type { ReactNode } from "react";
import type { PM, UiLibrary } from "../types";

interface NextStepsSectionProps {
  name: string;
  pm: PM;
  ui: UiLibrary;
}

export function NextStepsSection({ name, pm, ui }: NextStepsSectionProps) {
  const safeName = name.trim() || "my-school";
  const dlx = pm === "pnpm" ? "pnpm dlx" : pm === "yarn" ? "yarn dlx" : pm === "bun" ? "bunx" : "npx";
  const hasShadcn = ui === "shadcn";
  const devStep = hasShadcn ? 4 : 3;

  return (
    <section className="rounded-xl border border-fd-border bg-fd-card/40 p-6">
      <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-nexa-primary">
        Next steps
      </p>
      <h3 className="mb-4 text-base font-semibold text-fd-foreground">
        After running the command
      </h3>
      <ol className="space-y-3 text-sm text-fd-muted-foreground">
        <StepItem n={1}>
          <code className="rounded border border-fd-border bg-fd-background px-1.5 py-0.5 text-[11px] font-mono text-fd-foreground">
            cd {safeName} && {pm} install
          </code>
        </StepItem>

        <StepItem n={2}>
          Fill in{" "}
          <code className="rounded border border-fd-border bg-fd-background px-1 font-mono text-[11px] text-fd-foreground">
            .env.local
          </code>{" "}
          — add your{" "}
          <code className="font-mono text-[11px] text-fd-foreground">NEXA_API_KEY</code> and{" "}
          <code className="font-mono text-[11px] text-fd-foreground">NEXA_WEBHOOK_SECRET</code>{" "}
          from the Nexa dashboard.
        </StepItem>

        {hasShadcn && (
          <StepItem n={3}>
            Add your first shadcn component:{" "}
            <code className="rounded border border-fd-border bg-fd-background px-1.5 py-0.5 font-mono text-[11px] text-fd-foreground">
              {dlx} shadcn@latest add button
            </code>
          </StepItem>
        )}

        <StepItem n={devStep}>
          Run{" "}
          <code className="rounded border border-fd-border bg-fd-background px-1.5 py-0.5 font-mono text-[11px] text-fd-foreground">
            {pm} dev
          </code>{" "}
          and open{" "}
          <code className="font-mono text-[11px] text-fd-foreground">localhost:3000/dashboard</code>.
        </StepItem>
      </ol>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link
          href="/docs/getting-started/quickstart"
          className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5"
          style={{ background: "linear-gradient(135deg, hsl(158 64% 52%), hsl(142 76% 42%))" }}
        >
          Full quickstart guide →
        </Link>
        <Link
          href="/docs/getting-started/cli"
          className="inline-flex items-center gap-1.5 rounded-lg border border-fd-border bg-fd-card px-4 py-2 text-xs font-semibold text-fd-foreground transition-all hover:-translate-y-0.5 hover:border-nexa-primary/30"
        >
          CLI reference →
        </Link>
      </div>
    </section>
  );
}

function StepItem({ n, children }: { n: number; children: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-nexa-primary/30 bg-nexa-primary/10 font-mono text-[10px] font-bold text-nexa-primary">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}
