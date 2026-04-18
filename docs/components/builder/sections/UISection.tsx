import type { UiLibrary, PM } from "../types";
import { SectionHeader, OptionCard } from "../primitives";

interface UISectionProps {
  ui: UiLibrary;
  pm: PM;
  onChange: (ui: UiLibrary) => void;
}

export function UISection({ ui, pm, onChange }: UISectionProps) {
  const dlx = pm === "pnpm" ? "pnpm dlx" : pm === "yarn" ? "yarn dlx" : pm === "bun" ? "bunx" : "npx";

  return (
    <section>
      <SectionHeader label="UI Library" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OptionCard
          title="None"
          description="Plain Tailwind CSS. Use @nexa-ed/react components as-is. Best if you already have a design system or want full control."
          badge="Default"
          selected={ui === "none"}
          onClick={() => onChange("none")}
        />
        <OptionCard
          title="shadcn/ui"
          description="Accessible, copy-paste components built on Radix UI. Scaffolds components.json, lib/utils.ts (cn helper), and wires Tailwind with shadcn CSS tokens."
          badge="Recommended"
          selected={ui === "shadcn"}
          onClick={() => onChange("shadcn")}
        />
      </div>
      {ui === "shadcn" && (
        <p className="mt-3 text-xs text-fd-muted-foreground">
          After scaffolding, add your first component:{" "}
          <code className="rounded border border-fd-border bg-fd-background px-1.5 py-0.5 font-mono text-[11px] text-fd-foreground">
            {dlx} shadcn@latest add button
          </code>
        </p>
      )}
    </section>
  );
}
