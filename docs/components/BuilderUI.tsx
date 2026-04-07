"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type Auth = "clerk" | "nextauth" | "none";
type Feature = "fileProcessing" | "payments" | "convex" | "emailProvisioning";
type EmailTier = "tier-1-nexa" | "tier-2-stalwart" | "tier-3-google";
type PM = "pnpm" | "npm" | "yarn" | "bun";

interface BuilderState {
  name: string;
  auth: Auth;
  features: Feature[];
  emailTier: EmailTier;
  pm: PM;
}

const DEFAULTS: BuilderState = {
  name: "my-school",
  auth: "clerk",
  features: [],
  emailTier: "tier-1-nexa",
  pm: "pnpm",
};

/* ─── Command builder ────────────────────────────────────────────────────── */

function buildCommand(s: BuilderState): string {
  const safeName = s.name.trim() || "my-school";
  const hasEmail = s.features.includes("emailProvisioning");

  const base =
    s.pm === "pnpm"
      ? `pnpm create nexaed-app ${safeName}`
      : s.pm === "yarn"
      ? `yarn create nexaed-app ${safeName}`
      : s.pm === "bun"
      ? `bunx create-nexaed-app ${safeName}`
      : `npx create-nexaed-app ${safeName}`;

  const parts: string[] = [base];

  if (s.auth !== "none") parts.push(`--auth ${s.auth}`);
  if (s.features.length > 0) parts.push(`--features ${s.features.join(",")}`);
  if (hasEmail) parts.push(`--email-tier ${s.emailTier}`);
  if (s.pm !== "pnpm" && s.pm !== "npm") parts.push(`--pm ${s.pm}`);
  if (s.pm === "npm") parts.push(`--pm npm`);

  return parts.join(" \\\n  ");
}

/* ─── State ↔ URL ────────────────────────────────────────────────────────── */

function stateToParams(s: BuilderState): URLSearchParams {
  const p = new URLSearchParams();
  if (s.name !== DEFAULTS.name) p.set("name", s.name);
  if (s.auth !== DEFAULTS.auth) p.set("auth", s.auth);
  if (s.features.length > 0) p.set("features", s.features.join(","));
  if (s.features.includes("emailProvisioning") && s.emailTier !== DEFAULTS.emailTier)
    p.set("emailTier", s.emailTier);
  if (s.pm !== DEFAULTS.pm) p.set("pm", s.pm);
  return p;
}

function paramsToState(params: URLSearchParams): BuilderState {
  const raw = {
    name: params.get("name") ?? DEFAULTS.name,
    auth: (params.get("auth") as Auth) ?? DEFAULTS.auth,
    features: (params.get("features")?.split(",").filter(Boolean) as Feature[]) ?? [],
    emailTier: (params.get("emailTier") as EmailTier) ?? DEFAULTS.emailTier,
    pm: (params.get("pm") as PM) ?? DEFAULTS.pm,
  };
  // Validate to prevent URL-injected garbage
  const validAuth: Auth[] = ["clerk", "nextauth", "none"];
  const validFeatures: Feature[] = ["fileProcessing", "payments", "convex", "emailProvisioning"];
  const validTiers: EmailTier[] = ["tier-1-nexa", "tier-2-stalwart", "tier-3-google"];
  const validPMs: PM[] = ["pnpm", "npm", "yarn", "bun"];
  return {
    name: raw.name.slice(0, 60).replace(/[^a-z0-9_-]/gi, "-") || DEFAULTS.name,
    auth: validAuth.includes(raw.auth) ? raw.auth : DEFAULTS.auth,
    features: raw.features.filter((f) => validFeatures.includes(f)),
    emailTier: validTiers.includes(raw.emailTier) ? raw.emailTier : DEFAULTS.emailTier,
    pm: validPMs.includes(raw.pm) ? raw.pm : DEFAULTS.pm,
  };
}

/* ─── Small helper components ────────────────────────────────────────────── */

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="mb-5 flex items-center gap-2">
      <span className="font-mono text-xs font-bold text-nexa-primary select-none">&gt;_</span>
      <h2 className="font-mono text-xs font-bold uppercase tracking-widest text-fd-foreground">
        {label}
      </h2>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="7" cy="7" r="6" />
      <polyline points="4.5,7 6.5,9 9.5,5" />
    </svg>
  );
}

function XIcon({ size = 10 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 10 10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
    >
      <line x1="2" y1="2" x2="8" y2="8" />
      <line x1="8" y1="2" x2="2" y2="8" />
    </svg>
  );
}

interface OptionCardProps {
  title: string;
  description: string;
  badge?: string;
  selected: boolean;
  disabled?: boolean;
  incompatibleReason?: string;
  onClick: () => void;
}

function OptionCard({
  title,
  description,
  badge,
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
            background:
              "linear-gradient(90deg, transparent, hsl(158 64% 52% / 0.5), transparent)",
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

/* ─── Main Builder Component ─────────────────────────────────────────────── */

export default function BuilderUI() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [state, setState] = useState<BuilderState>(() => paramsToState(searchParams));
  const [copied, setCopied] = useState(false);
  const [shared, setShared] = useState(false);

  // Sync URL on state change (debounced)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const p = stateToParams(state);
      const qs = p.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    }, 300);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [state, router]);

  const command = buildCommand(state);

  const toggleFeature = useCallback((f: Feature) => {
    setState((prev) => {
      const has = prev.features.includes(f);
      const next = has ? prev.features.filter((x) => x !== f) : [...prev.features, f];
      // If removing emailProvisioning, reset emailTier
      return { ...prev, features: next };
    });
  }, []);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(command.replace(/\\\n\s+/g, " ")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [command]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setShared(true);
      setTimeout(() => setShared(false), 1500);
    });
  }, []);

  const handleReset = useCallback(() => {
    setState(DEFAULTS);
  }, []);

  const hasEmail = state.features.includes("emailProvisioning");

  // Selected stack tags for the panel
  const stackTags: { label: string; key: string }[] = [];
  if (state.auth !== "none") {
    stackTags.push({
      label: state.auth === "clerk" ? "Clerk" : "NextAuth",
      key: "auth",
    });
  }
  const featureLabels: Record<Feature, string> = {
    fileProcessing: "File Processing",
    payments: "Payments",
    convex: "Convex",
    emailProvisioning: "Email Provisioning",
  };
  state.features.forEach((f) => stackTags.push({ label: featureLabels[f], key: f }));
  if (hasEmail) {
    const tierLabels: Record<EmailTier, string> = {
      "tier-1-nexa": "Tier 1 · Nexa",
      "tier-2-stalwart": "Tier 2 · Self-hosted",
      "tier-3-google": "Tier 3 · Google WS",
    };
    stackTags.push({ label: tierLabels[state.emailTier], key: "emailTier" });
  }
  stackTags.push({ label: state.pm, key: "pm" });

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* ── LEFT PANEL ─────────────────────────────────────────────────── */}
      <aside className="relative w-full shrink-0 border-b border-fd-border bg-fd-card/60 lg:sticky lg:top-0 lg:h-screen lg:w-[300px] lg:overflow-y-auto lg:border-b-0 lg:border-r">
        {/* Subtle top glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-40"
          style={{
            background:
              "linear-gradient(to bottom, hsl(158 64% 52% / 0.07), transparent)",
          }}
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
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  name: e.target.value.replace(/[^a-z0-9_-]/gi, "-").slice(0, 60),
                }))
              }
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
                onClick={handleCopy}
                className="flex items-center gap-1 rounded border border-fd-border bg-fd-background px-2 py-0.5 font-mono text-[10px] text-fd-muted-foreground transition-colors hover:border-nexa-primary/40 hover:text-nexa-primary"
              >
                {copied ? (
                  <>
                    <CheckIcon />
                    Copied
                  </>
                ) : (
                  <>
                    <CopyIcon />
                    Copy
                  </>
                )}
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background">
              {/* Terminal titlebar */}
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
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={handleShare}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-fd-border bg-fd-background py-2 text-xs font-medium text-fd-muted-foreground transition-colors hover:border-nexa-primary/40 hover:text-fd-foreground"
            >
              <ShareIcon />
              {shared ? "Link copied!" : "Share this config"}
            </button>
            <button
              type="button"
              onClick={handleReset}
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
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M1 6h10M6 1l5 5-5 5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              View full CLI reference
            </Link>
          </div>
        </div>
      </aside>

      {/* ── RIGHT CONTENT ───────────────────────────────────────────────── */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-4xl px-6 py-10 space-y-14">

          {/* AUTH PROVIDER */}
          <section>
            <SectionHeader label="Auth Provider" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <OptionCard
                title="Clerk"
                description="Zero-config auth with pre-built components, session management, and webhooks. Recommended for new projects."
                badge="Recommended"
                selected={state.auth === "clerk"}
                onClick={() => setState((p) => ({ ...p, auth: "clerk" }))}
              />
              <OptionCard
                title="NextAuth"
                description="Flexible, bring-your-own auth via next-auth v5 (Auth.js). Supports any OAuth provider or credentials flow."
                selected={state.auth === "nextauth"}
                onClick={() => setState((p) => ({ ...p, auth: "nextauth" }))}
              />
              <OptionCard
                title="No Auth"
                description="Skip auth setup entirely. You manage authentication yourself or add it later."
                selected={state.auth === "none"}
                onClick={() => setState((p) => ({ ...p, auth: "none" }))}
              />
            </div>
          </section>

          {/* FEATURES */}
          <section>
            <SectionHeader label="Features" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <OptionCard
                title="File Processing"
                description="Upload PDFs, stream real-time OCR progress via SSE, and retrieve structured student academic records. Powered by Google Document AI."
                selected={state.features.includes("fileProcessing")}
                onClick={() => toggleFeature("fileProcessing")}
              />
              <OptionCard
                title="Payments"
                description="Paystack-backed enrollment fees with automatic surcharge calculation, webhook forwarding, and per-tenant configuration."
                selected={state.features.includes("payments")}
                onClick={() => toggleFeature("payments")}
              />
              <OptionCard
                title="Convex Backend"
                description="Schema fragments, reactive queries, and webhook handlers that sync Nexa events into your Convex backend in real-time."
                selected={state.features.includes("convex")}
                onClick={() => toggleFeature("convex")}
              />
              <OptionCard
                title="Student Email Provisioning"
                description="Provision school email accounts on your own domain, via Google Workspace, or on a Nexa subdomain. Bulk-create 500 accounts in one call."
                selected={state.features.includes("emailProvisioning")}
                onClick={() => toggleFeature("emailProvisioning")}
              />
            </div>
          </section>

          {/* EMAIL TIER — only when emailProvisioning is selected */}
          {hasEmail && (
            <section>
              <SectionHeader label="Email Tier" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <OptionCard
                  title="Tier 1 · Nexa Subdomain"
                  description="Fastest setup. Nexa manages the mail server. Students get addresses like name@yourschool.nexa-ed.com — no DNS required."
                  badge="Default"
                  selected={state.emailTier === "tier-1-nexa"}
                  onClick={() => setState((p) => ({ ...p, emailTier: "tier-1-nexa" }))}
                />
                <OptionCard
                  title="Tier 2 · Self-hosted"
                  description="Bring your own domain. Nexa provisions mailboxes on a self-hosted Stalwart mail server. Requires DNS setup and a verified domain."
                  selected={state.emailTier === "tier-2-stalwart"}
                  onClick={() => setState((p) => ({ ...p, emailTier: "tier-2-stalwart" }))}
                />
                <OptionCard
                  title="Tier 3 · Google Workspace"
                  description="Use the school's existing Google Workspace account. Nexa provisions accounts via the Admin SDK with domain delegation."
                  selected={state.emailTier === "tier-3-google"}
                  onClick={() => setState((p) => ({ ...p, emailTier: "tier-3-google" }))}
                />
              </div>
              <p className="mt-3 text-xs text-fd-muted-foreground">
                Tier 2 and Tier 3 require a{" "}
                <Link href="/docs/sdk/domain-setup" className="text-nexa-primary hover:underline">
                  verified domain
                </Link>{" "}
                and a live API key.
              </p>
            </section>
          )}

          {/* PACKAGE MANAGER */}
          <section>
            <SectionHeader label="Package Manager" />
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {(
                [
                  { id: "pnpm", label: "pnpm", desc: "Fast, disk-efficient. Recommended." },
                  { id: "npm", label: "npm", desc: "Node.js default." },
                  { id: "yarn", label: "yarn", desc: "Classic Yarn v1 / Berry." },
                  { id: "bun", label: "bun", desc: "Ultra-fast all-in-one runtime." },
                ] as { id: PM; label: string; desc: string }[]
              ).map(({ id, label, desc }) => (
                <OptionCard
                  key={id}
                  title={label}
                  description={desc}
                  badge={id === "pnpm" ? "Default" : undefined}
                  selected={state.pm === id}
                  onClick={() => setState((p) => ({ ...p, pm: id }))}
                />
              ))}
            </div>
          </section>

          {/* GENERATED PROJECT PREVIEW */}
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

          {/* Next steps */}
          <section className="rounded-xl border border-fd-border bg-fd-card/40 p-6">
            <p className="mb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-nexa-primary">
              Next steps
            </p>
            <h3 className="mb-4 text-base font-semibold text-fd-foreground">
              After running the command
            </h3>
            <ol className="space-y-3 text-sm text-fd-muted-foreground">
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-nexa-primary/30 bg-nexa-primary/10 font-mono text-[10px] font-bold text-nexa-primary">
                  1
                </span>
                <span>
                  <code className="rounded border border-fd-border bg-fd-background px-1.5 py-0.5 text-[11px] font-mono text-fd-foreground">
                    cd {state.name.trim() || "my-school"} && {state.pm} install
                  </code>
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-nexa-primary/30 bg-nexa-primary/10 font-mono text-[10px] font-bold text-nexa-primary">
                  2
                </span>
                <span>
                  Fill in{" "}
                  <code className="rounded border border-fd-border bg-fd-background px-1 font-mono text-[11px] text-fd-foreground">
                    .env.local
                  </code>{" "}
                  — add your{" "}
                  <code className="font-mono text-[11px] text-fd-foreground">NEXA_API_KEY</code> and{" "}
                  <code className="font-mono text-[11px] text-fd-foreground">
                    NEXA_WEBHOOK_SECRET
                  </code>{" "}
                  from the Nexa dashboard.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-nexa-primary/30 bg-nexa-primary/10 font-mono text-[10px] font-bold text-nexa-primary">
                  3
                </span>
                <span>
                  Run{" "}
                  <code className="rounded border border-fd-border bg-fd-background px-1.5 py-0.5 font-mono text-[11px] text-fd-foreground">
                    {state.pm} dev
                  </code>{" "}
                  and open{" "}
                  <code className="font-mono text-[11px] text-fd-foreground">
                    localhost:3000/dashboard
                  </code>
                  .
                </span>
              </li>
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
        </div>
      </main>
    </div>
  );
}

/* ─── File tree preview ──────────────────────────────────────────────────── */

function FileTree({ state }: { state: BuilderState }) {
  const name = state.name.trim() || "my-school";
  const hasFile = state.features.includes("fileProcessing");
  const hasPay = state.features.includes("payments");
  const hasConvex = state.features.includes("convex");
  const hasEmail = state.features.includes("emailProvisioning");
  const hasClerk = state.auth === "clerk";
  const hasNextAuth = state.auth === "nextauth";

  const lines: string[] = [
    `<span class="text-fd-foreground font-semibold">${name}/</span>`,
    `├── app/`,
    `│   ├── api/nexa/[...nexaed]/`,
    `│   │   └── <span class="text-nexa-primary">route.ts</span>        ← webhook handler`,
    hasFile ? `│   ├── api/nexa/upload/route.ts  ← file upload endpoint` : "",
    hasPay ? `│   ├── api/nexa/payments/route.ts ← payment forwarding` : "",
    hasEmail ? `│   ├── api/nexa/email/route.ts   ← email provisioning` : "",
    `│   ├── dashboard/`,
    `│   │   └── <span class="text-nexa-primary">page.tsx</span>        ← main dashboard`,
    `│   ├── layout.tsx`,
    `│   └── providers.tsx`,
    `├── lib/`,
    `│   ├── <span class="text-nexa-primary">nexa.ts</span>             ← SDK client${hasClerk ? " (Clerk)" : hasNextAuth ? " (NextAuth)" : ""}`,
    hasConvex ? `│   └── convex/schema.ts        ← Nexa schema fragments` : "",
    `├── .env.local                ← NEXA_API_KEY, NEXA_WEBHOOK_SECRET`,
    `├── .env.example`,
    `├── package.json`,
    `└── README.md`,
  ]
    .filter(Boolean)
    .join("\n");

  return <span dangerouslySetInnerHTML={{ __html: lines }} />;
}

/* ─── Inline SVG icons ───────────────────────────────────────────────────── */

function CopyIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="4" y="4" width="7" height="7" rx="1.5" strokeLinecap="round" />
      <path d="M8 4V2.5A1.5 1.5 0 006.5 1h-4A1.5 1.5 0 001 2.5v4A1.5 1.5 0 002.5 8H4" strokeLinecap="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="2.5" r="1.5" />
      <circle cx="2.5" cy="7" r="1.5" />
      <circle cx="11" cy="11.5" r="1.5" />
      <line x1="4" y1="7.7" x2="9.5" y2="10.8" />
      <line x1="9.5" y1="3.2" x2="4" y2="6.3" />
    </svg>
  );
}

function ResetIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 7a5 5 0 1 0 .9-2.9" />
      <polyline points="2,2 2,7 7,7" />
    </svg>
  );
}
