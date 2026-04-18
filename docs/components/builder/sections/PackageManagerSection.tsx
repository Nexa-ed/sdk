import type { PM } from "../types";
import { SectionHeader, OptionCard } from "../primitives";

const PM_OPTIONS: { id: PM; label: string; desc: string }[] = [
  { id: "pnpm", label: "pnpm", desc: "Fast, disk-efficient. Recommended." },
  { id: "npm",  label: "npm",  desc: "Node.js default." },
  { id: "yarn", label: "yarn", desc: "Classic Yarn v1 / Berry." },
  { id: "bun",  label: "bun",  desc: "Ultra-fast all-in-one runtime." },
];

interface PackageManagerSectionProps {
  pm: PM;
  onChange: (pm: PM) => void;
}

export function PackageManagerSection({ pm, onChange }: PackageManagerSectionProps) {
  return (
    <section>
      <SectionHeader label="Package Manager" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {PM_OPTIONS.map(({ id, label, desc }) => (
          <OptionCard
            key={id}
            title={label}
            description={desc}
            badge={id === "pnpm" ? "Default" : undefined}
            selected={pm === id}
            onClick={() => onChange(id)}
          />
        ))}
      </div>
    </section>
  );
}
