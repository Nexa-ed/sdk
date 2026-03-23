import type { ReactNode } from "react";

// Covers both our type names and fumadocs-ui's built-in vocabulary
type CalloutType = "note" | "info" | "tip" | "warn" | "warning" | "error";

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
  /** unused — accepted for compatibility with fumadocs built-in Callout */
  icon?: ReactNode;
}

const InfoIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

const WarnIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const TipIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <line x1="9" y1="18" x2="15" y2="18" />
    <line x1="10" y1="22" x2="14" y2="22" />
    <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 1.98.87 2.5.7.76 1.23 1.52 1.41 2.5" />
  </svg>
);

const ErrorIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
);

type VariantConfig = {
  label: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
  icon: ReactNode;
};

const variants: Record<string, VariantConfig> = {
  note: {
    label: "Note",
    borderClass: "border-blue-500/40",
    bgClass: "bg-blue-500/5",
    textClass: "text-blue-400",
    icon: <InfoIcon />,
  },
  info: {
    label: "Info",
    borderClass: "border-blue-500/40",
    bgClass: "bg-blue-500/5",
    textClass: "text-blue-400",
    icon: <InfoIcon />,
  },
  tip: {
    label: "Tip",
    borderClass: "border-nexa-primary/40",
    bgClass: "bg-nexa-primary/5",
    textClass: "text-nexa-primary",
    icon: <TipIcon />,
  },
  warn: {
    label: "Warning",
    borderClass: "border-amber-500/40",
    bgClass: "bg-amber-500/5",
    textClass: "text-amber-400",
    icon: <WarnIcon />,
  },
  warning: {
    label: "Warning",
    borderClass: "border-amber-500/40",
    bgClass: "bg-amber-500/5",
    textClass: "text-amber-400",
    icon: <WarnIcon />,
  },
  error: {
    label: "Error",
    borderClass: "border-red-500/40",
    bgClass: "bg-red-500/5",
    textClass: "text-red-400",
    icon: <ErrorIcon />,
  },
};

// Fallback for any unknown type values
const fallback: VariantConfig = {
  label: "Note",
  borderClass: "border-fd-border",
  bgClass: "bg-fd-card",
  textClass: "text-fd-muted-foreground",
  icon: <InfoIcon />,
};

export function Callout({ type = "note", title, children }: CalloutProps) {
  const v = variants[type] ?? fallback;
  const displayTitle = title ?? v.label;

  return (
    <div className={`my-5 flex gap-3 rounded-lg border-l-4 ${v.borderClass} ${v.bgClass} px-4 py-3.5`}>
      <div className={`mt-0.5 shrink-0 ${v.textClass}`}>{v.icon}</div>
      <div className="min-w-0 flex-1">
        <p className={`mb-1 text-sm font-semibold ${v.textClass}`}>{displayTitle}</p>
        <div className="text-sm leading-relaxed text-fd-foreground [&_code]:rounded [&_code]:border [&_code]:border-fd-border [&_code]:bg-fd-background [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs">
          {children}
        </div>
      </div>
    </div>
  );
}
