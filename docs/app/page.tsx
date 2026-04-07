import Link from "next/link";

/* ─── Data ──────────────────────────────────────────────────────────────── */

const integrations = [
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
      </svg>
    ),
    title: "REST API",
    description: "Any language or stack — cURL, Python, PHP, Go. Authenticate with an API key and call HTTP endpoints directly. No SDK needed.",
    href: "/docs/rest-api",
    label: "No SDK",
    labelType: "badge" as const,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    title: "Node.js",
    description: "Express, Fastify, Hono, or raw Node. Webhook handlers, SSE proxy helpers, and the full NexaClient for any server framework.",
    href: "/docs/node",
    label: "@nexa-ed/node",
    labelType: "pkg" as const,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5" />
        <path d="M2 12l10 5 10-5" />
      </svg>
    ),
    title: "React",
    description: "Pre-built components and hooks for any React 19+ app — Vite, Remix, or CRA. Bring your own router.",
    href: "/docs/react/components",
    label: "@nexa-ed/react",
    labelType: "pkg" as const,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
    title: "Next.js",
    description: "One catch-all route handles upload, SSE progress, webhooks, and payments. The fastest path from install to production.",
    href: "/docs/getting-started/quickstart",
    label: "Recommended",
    labelType: "badge" as const,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
    title: "Convex",
    description: "Schema fragments, reactive queries, and webhook handlers that sync Nexa events straight into your Convex backend.",
    href: "/docs/sdk/webhooks",
    label: "@nexa-ed/convex",
    labelType: "pkg" as const,
  },
  {
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19l7-7 3 3-7 7-3-3z" />
        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
        <path d="M2 2l7.586 7.586" />
        <circle cx="11" cy="11" r="2" />
      </svg>
    ),
    title: "Vue / Svelte",
    description: "Zero-dependency core SDK with full guides for Vue 3, Nuxt 3, and SvelteKit. Composables and stores included.",
    href: "/docs/frameworks/vue",
    label: "@nexa-ed/sdk",
    labelType: "pkg" as const,
  },
];

const capabilities = [
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "File Processing",
    description: "Upload PDFs, stream real-time OCR progress, and retrieve fully structured student records — all in a single SDK call.",
    href: "/docs/sdk/files",
    ref: "sdk/files",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
        <line x1="1" y1="10" x2="23" y2="10" />
      </svg>
    ),
    title: "Payments",
    description: "Paystack-backed enrollment fees with automatic surcharge calculation, webhook forwarding, and per-tenant configuration.",
    href: "/docs/sdk/payments",
    ref: "sdk/payments",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
    title: "React Components",
    description: "Results viewer, upload zone, payment widget, pipeline timeline — production-ready UI with zero additional setup.",
    href: "/docs/react/components",
    ref: "react/components",
  },
  {
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
      </svg>
    ),
    title: "Student Emails",
    description: "Provision school email accounts on your own domain, via Google Workspace, or on a Nexa subdomain. Bulk-create 500 accounts in one call.",
    href: "/docs/sdk/emails",
    ref: "sdk/emails",
  },
];

const stats = [
  { value: "5 min", label: "to first integration" },
  { value: "6", label: "SDK packages" },
  { value: "100%", label: "TypeScript" },
];

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-fd-background">

      {/* Dot-grid background */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dot-grid" />

      {/* Top emerald atmospheric glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[600px] w-[1000px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: "radial-gradient(ellipse, hsl(158 64% 52% / 0.07) 0%, transparent 68%)" }}
      />

      {/* ── 1. HERO ─────────────────────────────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-10 pt-24 text-center">

        {/* Status badge */}
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-fd-border bg-fd-card px-3.5 py-1 text-xs font-medium text-fd-muted-foreground">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-nexa-primary" />
          Beta — Now available
        </div>

        {/* Headline */}
        <h1 className="mb-5 text-[clamp(2.75rem,9vw,6rem)] font-bold leading-none tracking-tight text-fd-foreground">
          Nexa Ed{" "}
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: "linear-gradient(135deg, hsl(158 64% 58%), hsl(167 82% 50%), hsl(142 76% 42%))" }}
          >
            SDK
          </span>
        </h1>

        {/* Tagline */}
        <p className="mx-auto mb-9 max-w-xl text-base leading-relaxed text-fd-muted-foreground md:text-lg">
          Student results processing, Paystack payments, student email provisioning, and AI document analysis —
          for any language, any framework, in minutes.
        </p>

        {/* CTAs */}
        <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/docs/getting-started/installation"
            className="group inline-flex items-center gap-2 rounded-lg px-6 py-2.5 text-sm font-semibold text-white shadow-glow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-glow-md"
            style={{ background: "linear-gradient(135deg, hsl(158 64% 52%), hsl(142 76% 42%))" }}
          >
            Get Started
            <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/builder"
            className="group inline-flex items-center gap-2 rounded-lg border border-nexa-primary/30 bg-nexa-primary/5 px-6 py-2.5 text-sm font-semibold text-nexa-primary transition-all duration-200 hover:-translate-y-0.5 hover:bg-nexa-primary/10 hover:shadow-glow-sm"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <rect x="1" y="1" width="5" height="5" rx="1" />
              <rect x="8" y="1" width="5" height="5" rx="1" />
              <rect x="1" y="8" width="5" height="5" rx="1" />
              <rect x="8" y="8" width="5" height="5" rx="1" />
            </svg>
            Try the Builder
          </Link>
          <Link
            href="/docs/rest-api"
            className="inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-6 py-2.5 text-sm font-semibold text-fd-foreground transition-all duration-200 hover:-translate-y-0.5 hover:border-nexa-primary/40 hover:bg-fd-accent"
          >
            REST API Reference
          </Link>
        </div>

        {/* Stats — anchored directly below CTAs */}
        <div className="mt-12 flex items-center justify-center divide-x divide-fd-border rounded-xl border border-fd-border bg-fd-card/50 py-0 sm:mx-auto sm:w-fit">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center px-8 py-3">
              <span className="text-base font-bold text-fd-foreground">{s.value}</span>
              <span className="text-[11px] text-fd-muted-foreground">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── 2. INTEGRATION PICKER ───────────────────────────────────────── */}
      <section className="relative z-10 mx-auto w-full max-w-5xl px-6 pb-20 pt-16">

        {/* Section header */}
        <div className="mb-10 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-nexa-primary">
            Choose your integration
          </p>
          <h2 className="mb-2.5 text-2xl font-bold text-fd-foreground md:text-3xl">
            Start with your stack
          </h2>
          <p className="mx-auto max-w-sm text-sm leading-relaxed text-fd-muted-foreground">
            Pick the approach that fits your project — every path leads to the same powerful API.
          </p>
        </div>

        {/* 6-card grid */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {integrations.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group relative flex flex-col gap-3.5 overflow-hidden rounded-xl border border-fd-border bg-fd-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-nexa-primary/30 hover:shadow-card-hover"
            >
              {/* Top glow line */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{ background: "linear-gradient(90deg, transparent, hsl(158 64% 52% / 0.6), transparent)" }}
              />

              {/* Icon + label row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-nexa-primary/20 bg-nexa-primary/10 text-nexa-primary">
                  {item.icon}
                </div>

                {item.labelType === "badge" ? (
                  <span className="mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold"
                    style={{
                      background: "hsl(158 64% 52% / 0.1)",
                      color: "hsl(158 64% 52%)",
                      borderColor: "hsl(158 64% 52% / 0.25)",
                    }}>
                    {item.label}
                  </span>
                ) : (
                  <code className="mt-0.5 shrink-0 rounded border border-fd-border bg-fd-background px-1.5 py-0.5 text-[10px] font-mono text-fd-muted-foreground">
                    {item.label}
                  </code>
                )}
              </div>

              {/* Text */}
              <div className="flex-1">
                <p className="mb-1 font-semibold text-fd-foreground">{item.title}</p>
                <p className="text-xs leading-relaxed text-fd-muted-foreground">
                  {item.description}
                </p>
              </div>

              {/* Always-visible CTA */}
              <span className="flex items-center gap-1 text-xs font-medium text-nexa-primary">
                View guide
                <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 3. CAPABILITIES ─────────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-fd-border">
        {/* Subtle mid-page glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-[260px] w-[600px] -translate-x-1/2 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse, hsl(158 64% 52% / 0.04) 0%, transparent 70%)" }}
        />

        <div className="relative mx-auto w-full max-w-5xl px-6 py-16">

          {/* Section header */}
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-nexa-primary">
              What&apos;s included
            </p>
            <h2 className="mb-2.5 text-2xl font-bold text-fd-foreground">
              Everything your school app needs
            </h2>
            <p className="mx-auto max-w-sm text-sm leading-relaxed text-fd-muted-foreground">
              Four core modules — each with a typed SDK, React components, and REST endpoints.
            </p>
          </div>

          {/* Capability cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {capabilities.map((cap) => (
              <Link
                key={cap.title}
                href={cap.href}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-xl border border-fd-border bg-fd-card/60 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-nexa-primary/30 hover:bg-fd-card hover:shadow-card-hover"
              >
                {/* Top glow line */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{ background: "linear-gradient(90deg, transparent, hsl(158 64% 52% / 0.5), transparent)" }}
                />

                {/* Icon + ref tag */}
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-nexa-primary/20 bg-nexa-primary/10 text-nexa-primary">
                    {cap.icon}
                  </div>
                  <code className="rounded border border-fd-border bg-fd-background px-2 py-0.5 text-[10px] font-mono text-fd-muted-foreground">
                    {cap.ref}
                  </code>
                </div>

                {/* Text */}
                <div className="flex-1">
                  <p className="mb-1.5 font-semibold text-fd-foreground">{cap.title}</p>
                  <p className="text-sm leading-relaxed text-fd-muted-foreground">
                    {cap.description}
                  </p>
                </div>

                {/* CTA */}
                <span className="flex items-center gap-1 text-xs font-medium text-nexa-primary">
                  SDK docs
                  <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. QUICK-START STRIP ────────────────────────────────────────── */}
      <section className="relative z-10 border-t border-fd-border bg-fd-card/40">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-start justify-between gap-10 px-6 py-16 md:flex-row md:items-center">

          {/* Left copy */}
          <div className="max-w-xs">
            <p className="mb-1 text-xs font-semibold uppercase tracking-widest text-nexa-primary">
              CLI scaffolder
            </p>
            <h2 className="mb-3 text-2xl font-bold text-fd-foreground">
              From zero to deployed in minutes
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-fd-muted-foreground">
              Scaffold a complete school app with routing, auth, results viewer,
              payments, and email provisioning — in a single command.
            </p>
            <Link
              href="/docs/getting-started/cli"
              className="inline-flex items-center gap-1 text-sm font-medium text-nexa-primary transition-colors hover:underline"
            >
              View CLI reference →
            </Link>
          </div>

          {/* Terminal + builder hint */}
          <div className="flex w-full flex-col gap-3 md:w-auto">
            <div className="overflow-hidden rounded-xl border border-fd-border bg-fd-background shadow-glow-sm">
              {/* macOS titlebar */}
              <div className="flex items-center gap-1.5 border-b border-fd-border bg-fd-card/40 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
                <span className="h-2.5 w-2.5 rounded-full bg-nexa-primary/70" />
                <span className="ml-2 text-[11px] text-fd-muted-foreground">terminal</span>
              </div>
              {/* Command */}
              <pre className="px-5 py-4 font-mono text-sm md:min-w-[400px]">
                <span className="select-none text-fd-muted-foreground">$ </span>
                <span className="text-nexa-primary">npx</span>{" "}
                <span className="text-fd-foreground">create-nexaed-app</span>{" "}
                <span className="text-fd-muted-foreground">my-school-app</span>
                <span className="ml-0.5 inline-block h-[1em] w-0.5 animate-pulse bg-nexa-primary align-middle" />
              </pre>
            </div>

            {/* Builder hint */}
            <Link
              href="/builder"
              className="group flex items-center justify-between gap-3 rounded-xl border border-nexa-primary/20 bg-nexa-primary/5 px-4 py-3 transition-all duration-200 hover:border-nexa-primary/40 hover:bg-nexa-primary/10"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-nexa-primary/25 bg-nexa-primary/10 text-nexa-primary">
                  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <rect x="1" y="1" width="5" height="5" rx="1" />
                    <rect x="8" y="1" width="5" height="5" rx="1" />
                    <rect x="1" y="8" width="5" height="5" rx="1" />
                    <rect x="8" y="8" width="5" height="5" rx="1" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-fd-foreground">Prefer clicking to typing?</p>
                  <p className="text-[11px] text-fd-muted-foreground">Use the visual Stack Builder</p>
                </div>
              </div>
              <span className="text-xs text-nexa-primary transition-transform duration-200 group-hover:translate-x-0.5">→</span>
            </Link>
          </div>

        </div>
      </section>

    </main>
  );
}
