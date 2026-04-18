import { CheckIcon } from "./icons";

/* ─── NewBadge ───────────────────────────────────────────────────────────── */

export function NewBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
      style={{
        background: "hsl(38 92% 50% / 0.12)",
        color: "hsl(38 92% 60%)",
        border: "1px solid hsl(38 92% 50% / 0.3)",
      }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full animate-pulse"
        style={{ background: "hsl(38 92% 60%)" }}
      />
      New
    </span>
  );
}

/* ─── SectionHeader ──────────────────────────────────────────────────────── */

export function SectionHeader({ label, isNew }: { label: string; isNew?: boolean }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <span className="font-mono text-xs font-bold text-nexa-primary select-none">&gt;_</span>
      <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-fd-foreground">
        {label}
      </h2>
      {isNew && <NewBadge />}
    </div>
  );
}

/* ─── OptionCard ─────────────────────────────────────────────────────────── */

export interface OptionCardProps {
  title: string;
  description: string;
  badge?: string;
  isNew?: boolean;
  selected: boolean;
  disabled?: boolean;
  incompatibleReason?: string;
  onClick: () => void;
}

export function OptionCard({
  title,
  description,
  badge,
  isNew,
  selected,
  disabled,
  incompatibleReason,
  onClick,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      title={incompatibleReason}
      className={[
        "group relative flex flex-col gap-2 overflow-hidden rounded-xl border p-4 text-left transition-all duration-200",
        selected
          ? "border-nexa-primary bg-nexa-primary/5 shadow-glow-sm"
          : disabled
          ? "border-fd-border bg-fd-card/40 opacity-40 cursor-not-allowed"
          : "border-fd-border bg-fd-card cursor-pointer hover:-translate-y-0.5 hover:border-nexa-primary/30 hover:shadow-card-hover",
      ].join(" ")}
    >
      {/* Top hover glow line */}
      {!disabled && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: "linear-gradient(90deg, transparent, hsl(158 64% 52% / 0.5), transparent)",
          }}
        />
      )}

      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <span
          className={[
            "text-sm font-semibold",
            selected ? "text-nexa-primary" : "text-fd-foreground",
          ].join(" ")}
        >
          {title}
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          {isNew && <NewBadge />}
          {badge && (
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
              style={{
                background: "hsl(158 64% 52% / 0.12)",
                color: "hsl(158 64% 52%)",
                border: "1px solid hsl(158 64% 52% / 0.25)",
              }}
            >
              {badge}
            </span>
          )}
          {selected && (
            <span className="text-nexa-primary">
              <CheckIcon />
            </span>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-xs leading-relaxed text-fd-muted-foreground">{description}</p>
    </button>
  );
}
