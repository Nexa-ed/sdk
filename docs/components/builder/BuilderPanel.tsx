import Link from "next/link";
import type { BuilderState, EmailTier, Feature } from "./types";
import { CheckIcon, CopyIcon, ShareIcon, ResetIcon, ArrowRightIcon } from "./icons";

interface BuilderPanelProps {
  state: BuilderState;
  command: string;
  flags: string;
  pinned: boolean;
  cliVersion: string | null;
  onTogglePin: (pinned: boolean) => void;
  copied: boolean;
  shared: boolean;
  onNameChange: (name: string) => void;
  onCopy: () => void;
  onCopyFull: () => void;
  onShare: () => void;
  onReset: () => void;
}

export function BuilderPanel({
  state,
  command,
  flags,
  pinned,
  cliVersion,
  onTogglePin,
  copied,
  shared,
  onNameChange,
  onCopy,
  onCopyFull,
  onShare,
  onReset,
}: BuilderPanelProps) {
  const stackTags = buildStackTags(state);

  return (
    <aside className="relative w-full shrink-0 border-b border-fd-border bg-fd-card/60 lg:sticky lg:top-0 lg:h-screen lg:w-[300px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
      {/* Subtle top glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-40"
        style={{ background: "linear-gradient(to bottom, hsl(158 64% 52% / 0.07), transparent)" }}
      />

      <div className="relative flex flex-col gap-5 p-5">
        {/* Project name */}
        <div>
          <label className="mb-1.5 block font-mono text-[10px] font-bold uppercase tracking-widest text-fd-muted-foreground">
            Project Name
          </label>
          <input
            type="text"
            value={state.name}
            onChange={(e) => onNameChange(e.target.value.replace(/[^a-z0-9_-]/gi, "-").slice(0, 60))}
            placeholder="my-school"
            className="w-full rounded-lg border border-fd-border bg-fd-background px-3 py-2 font-mono text-sm text-fd-foreground placeholder:text-fd-muted-foreground/50 outline-none transition-colors focus:border-nexa-primary/60 focus:ring-1 focus:ring-nexa-primary/20"
          />
        </div>

        {/* Selected stack */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-fd-muted-foreground">
              Selected Stack
            </span>
            <span className="rounded-full bg-nexa-primary/10 px-2 py-0.5 font-mono text-[10px] font-bold text-nexa-primary">
              {stackTags.length} picks
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {stackTags.map((tag) => (
              <span
                key={tag.key}
                className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium"
                style={{
                  background: "hsl(158 64% 52% / 0.08)",
                  color: "hsl(158 64% 52%)",
                  borderColor: "hsl(158 64% 52% / 0.2)",
                }}
              >
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* CLI command */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-fd-muted-foreground">
              CLI Command
            </span>
            <button
              type="button"
              onClick={onCopy}
              className="flex items-center gap-1 rounded border border-fd-border bg-fd-background px-2 py-0.5 font-mono text-[10px] text-fd-muted-foreground transition-colors hover:border-nexa-primary/40 hover:text-nexa-primary"
            >
              {copied ? <><CheckIcon /> Copied</> : <><CopyIcon /> Copy</>}
            </button>
          </div>
          <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background">
            <div className="flex items-center gap-1.5 border-b border-fd-border bg-fd-card/40 px-3 py-1.5">
              <span className="h-2 w-2 rounded-full bg-red-500/70" />
              <span className="h-2 w-2 rounded-full bg-yellow-500/70" />
              <span className="h-2 w-2 rounded-full bg-nexa-primary/70" />
            </div>
            <pre className="overflow-x-auto whitespace-pre-wrap break-all px-4 py-3 font-mono text-[11px] leading-relaxed text-nexa-primary">
              <span className="text-fd-muted-foreground select-none">$ </span>
              {command}
            </pre>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-fd-muted-foreground">
            This always runs the newest release — no version to remember. The prompts
            collect everything the command leaves out, so it works exactly as typed.
          </p>
          <label className="mt-2 flex cursor-pointer items-start gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-3 py-2">
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => onTogglePin(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 shrink-0 accent-nexa-primary"
            />
            <span className="text-[11px] leading-relaxed text-fd-muted-foreground">
              Pin this exact version
              {cliVersion ? <span className="font-mono"> ({cliVersion})</span> : null}
              <span className="block text-[10px] opacity-70">
                Off by default — unpinned runs always take the newest release. Turn on only for
                reproducible CI runs.
              </span>
            </span>
          </label>
          {flags ? (
            <div className="mt-2 flex items-start justify-between gap-2 rounded-lg border border-fd-border bg-fd-background/60 px-3 py-2">
              <div>
                <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-fd-muted-foreground">
                  Skip the prompts
                </span>
                <p className="mt-1 break-all font-mono text-[10px] leading-relaxed text-fd-muted-foreground">
                  {flags}
                </p>
              </div>
              <button
                type="button"
                onClick={onCopyFull}
                className="shrink-0 rounded border border-fd-border bg-fd-background px-2 py-0.5 font-mono text-[10px] text-fd-muted-foreground transition-colors hover:border-nexa-primary/40 hover:text-nexa-primary"
              >
                Copy
              </button>
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onShare}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background py-2 text-xs font-medium text-fd-muted-foreground transition-colors hover:border-nexa-primary/40 hover:text-fd-foreground"
          >
            <ShareIcon />
            {shared ? "Link copied!" : "Share this config"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background py-2 text-xs font-medium text-fd-muted-foreground transition-colors hover:border-red-500/30 hover:text-red-400"
          >
            <ResetIcon />
            Reset
          </button>
        </div>

        {/* Footer link */}
        <div className="border-t border-fd-border pt-3">
          <Link
            href="/docs/getting-started/cli"
            className="flex items-center gap-1.5 text-[11px] text-fd-muted-foreground transition-colors hover:text-nexa-primary"
          >
            <ArrowRightIcon />
            View full CLI reference
          </Link>
        </div>
      </div>
    </aside>
  );
}

/* ─── Stack tag derivation ───────────────────────────────────────────────── */

function buildStackTags(state: BuilderState): { label: string; key: string }[] {
  const tags: { label: string; key: string }[] = [];

  if (state.auth !== "none") {
    tags.push({
      label:
        state.auth === "workos" ? "WorkOS"
        : state.auth === "clerk" ? "Clerk"
        : "NextAuth",
      key: "auth",
    });
  }

  const featureLabels: Record<Feature, string> = {
    fileProcessing: "File Processing",
    payments: "Payments",
    convex: "Convex",
    emailProvisioning: "Email Provisioning",
  };
  state.features.forEach((f) => tags.push({ label: featureLabels[f], key: f }));

  if (state.features.includes("emailProvisioning")) {
    const tierLabels: Record<EmailTier, string> = {
      "tier-1-nexa": "Tier 1 · Nexa",
      "tier-2-stalwart": "Tier 2 · Self-hosted",
      "tier-3-google": "Tier 3 · Google WS",
    };
    tags.push({ label: tierLabels[state.emailTier], key: "emailTier" });
  }

  if (state.ui === "shadcn") tags.push({ label: "shadcn/ui", key: "ui" });
  if (!state.git) tags.push({ label: "No Git", key: "git" });
  tags.push({ label: state.pm, key: "pm" });

  return tags;
}
