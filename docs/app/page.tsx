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

      {/* ── 5. FOOTER ───────────────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-fd-border bg-fd-card/30">
        <div className="mx-auto w-full max-w-5xl px-6 py-10">
          <div className="flex flex-col items-center gap-6">

            {/* Logo + tagline */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 3745.05 1080" className="h-6 w-auto" aria-label="Nexa Ed">
              <defs><style>{`.fp-1{fill:#fff;}.fp-2{fill:#30c284;}.fp-3{fill:#d6f3e6;}`}</style></defs>
              <g>
                <path className="fp-1" d="M787.1,594l-5.91-5.91a32.67,32.67,0,0,0-46.2,0l-79.73,79.71a32.66,32.66,0,0,0,0,46.2L838.84,897.55a32.66,32.66,0,0,0,46.2,0l145.06-145a32.66,32.66,0,0,0,0-46.2l-89.45-89.45a74.7,74.7,0,0,1-21.87-52.8V201.18a32.67,32.67,0,0,0-32.67-32.67H837.66A32.67,32.67,0,0,0,805,201.18v8.69a10.48,10.48,0,0,1-10.48,10.48H766.93a10.49,10.49,0,0,0-10.49,10.48v20.25a10.49,10.49,0,0,0,10.49,10.48h0A10.48,10.48,0,0,1,777.41,272v20.28a10.48,10.48,0,0,1-10.48,10.48h0a10.49,10.49,0,0,0-10.49,10.49v20.24A10.49,10.49,0,0,0,766.93,344h27.58A10.49,10.49,0,0,1,805,354.5V586.56A10.48,10.48,0,0,1,787.1,594Zm45.61,172.16c13.64-13.58,36.84-17.83,58.56-1.53a11.29,11.29,0,0,1,2.48,2.59c14.87,21.67,10.66,43.9-2.69,57.3-13.56,13.62-36.74,17.84-58.38,1.68a11.4,11.4,0,0,1-2.53-2.61C815.13,802,819.32,779.59,832.71,766.14Z" />
                <path className="fp-1" d="M673.52,480.62l-30.25-30.36a12.6,12.6,0,0,0-8.95-3.73H566.48a21.2,21.2,0,0,0-21.14,21.25V595.27a21.2,21.2,0,0,0,21.14,21.25h89.63a21.2,21.2,0,0,0,21.14-21.25V489.64A12.74,12.74,0,0,0,673.52,480.62Zm-9.72,13.75-8.21.06a25.76,25.76,0,0,1-25.85-25.78v-8.34a4.38,4.38,0,0,1,7.47-3.12l29.66,29.66A4.41,4.41,0,0,1,663.8,494.37Z" />
                <path className="fp-1" d="M422.56,481.38l5.91,5.91a32.66,32.66,0,0,0,46.2,0l79.72-79.7a32.68,32.68,0,0,0,0-46.21L370.82,177.81a32.66,32.66,0,0,0-46.2,0l-145.06,145a32.68,32.68,0,0,0,0,46.21L269,458.5a74.67,74.67,0,0,1,21.87,52.8V874.18a32.67,32.67,0,0,0,32.67,32.67H372a32.67,32.67,0,0,0,32.67-32.67v-8.69A10.49,10.49,0,0,1,415.15,855h27.58a10.48,10.48,0,0,0,10.48-10.48V824.28a10.48,10.48,0,0,0-10.48-10.48h0a10.49,10.49,0,0,1-10.48-10.49V783a10.49,10.49,0,0,1,10.48-10.49h0a10.48,10.48,0,0,0,10.48-10.48V741.83a10.49,10.49,0,0,0-10.48-10.49H415.15a10.49,10.49,0,0,1-10.49-10.48V488.79A10.49,10.49,0,0,1,422.56,481.38ZM377,309.21c-13.65,13.59-36.84,17.84-58.56,1.53a11,11,0,0,1-2.48-2.58c-14.87-21.67-10.66-43.9,2.68-57.31,13.56-13.62,36.74-17.83,58.39-1.67a11.4,11.4,0,0,1,2.53,2.61C394.53,273.35,390.33,295.77,377,309.21Z" />
                <path className="fp-2" d="M2865.11,769.14V305.07a13.74,13.74,0,0,1,13.75-13.75h259.5a13.75,13.75,0,0,1,13.75,13.75v19.53a13.75,13.75,0,0,1-13.75,13.75H2936.73A13.76,13.76,0,0,0,2923,352.1V506.86a13.76,13.76,0,0,0,13.74,13.76l198,.17a13.76,13.76,0,0,1,13.74,13.75V551a13.74,13.74,0,0,1-13.76,13.75l-197.93-.18A13.76,13.76,0,0,0,2923,578.3V722.11a13.76,13.76,0,0,0,13.75,13.75h201.63a13.75,13.75,0,0,1,13.75,13.75v19.53a13.75,13.75,0,0,1-13.75,13.75h-259.5A13.75,13.75,0,0,1,2865.11,769.14Z" />
                <path className="fp-2" d="M3521.7,305.06V453a4.58,4.58,0,0,1-6.92,3.94l-31.23-18.47a185.56,185.56,0,0,0-94.46-25.75c-102.47,0-185.84,83.36-185.84,185.84s83.37,185.84,185.84,185.84a185.66,185.66,0,0,0,94.46-25.75l31.23-18.47a4.58,4.58,0,0,1,6.92,3.94V770a13.76,13.76,0,0,0,13.75,13.75h25.73A13.76,13.76,0,0,0,3574.93,770V305.06a13.75,13.75,0,0,0-13.75-13.75h-25.73A13.75,13.75,0,0,0,3521.7,305.06ZM3385.86,742c-72.81,0-132.05-64.5-132.05-143.78s59.24-143.82,132.05-143.82S3518,518.92,3518,598.22,3458.7,742,3385.86,742Z" />
                <path className="fp-3" d="M2017.33,761.48l126.88-168.94L2023.63,423.32a13.76,13.76,0,0,1,11.2-21.73h84.22a13.76,13.76,0,0,1,11.57,6.31l73.9,114.87,76.81-115.06a13.73,13.73,0,0,1,11.44-6.12h82.28a13.75,13.75,0,0,1,11.23,21.69L2265.56,594l126.72,167.43a13.75,13.75,0,0,1-11,22h-85.69a13.79,13.79,0,0,1-11.37-6l-79-115.92-81.94,116.1a13.73,13.73,0,0,1-11.23,5.82h-83.76A13.75,13.75,0,0,1,2017.33,761.48Z" />
                <path className="fp-3" d="M2030,592.2c-3.57-250.91-378.93-252.92-383.44,0-2.85,200.37,274.62,258.9,360.49,92,4.66-9.07-2.14-19.87-12.33-19.87h-85.21a4.56,4.56,0,0,0-3.58,1.78c-45.32,57.63-138,34.46-160.13-32.65a4.62,4.62,0,0,1,4.34-6.12h264.81a13.71,13.71,0,0,0,13.66-12A193.38,193.38,0,0,0,2030,592.2Zm-283.52-42.78c30.64-84.81,147.58-84.74,178.19,0a4.62,4.62,0,0,1-4.28,6.25H1750.75A4.62,4.62,0,0,1,1746.46,549.42Z" />
                <path className="fp-3" d="M1162.87,769.74v-464a13.76,13.76,0,0,1,13.75-13.75h54.28a13.73,13.73,0,0,1,10.52,4.9l235.34,279.5q8.41,9.84,16.5,20t15.8,20.72a362.42,362.42,0,0,1-2.81-36.87q-.7-21.41-.7-43.19V305.69a13.75,13.75,0,0,1,13.75-13.75h62.38a13.76,13.76,0,0,1,13.75,13.75V769.74a13.76,13.76,0,0,1-13.75,13.75h-43.75a13.73,13.73,0,0,1-10.52-4.9L1283,487.86q-8.43-9.83-16.51-20t-15.8-20.72a365.8,365.8,0,0,1,2.81,36.87q.69,21.42.71,43.18V769.74a13.76,13.76,0,0,1-13.76,13.75h-63.78A13.76,13.76,0,0,1,1162.87,769.74Z" />
                <path className="fp-3" d="M2668.82,414.39v4.78a4.56,4.56,0,0,1-6.76,4c-121-68.58-286,26.63-282,168.87-4,142.28,161,237.42,282,168.91a4.57,4.57,0,0,1,6.76,4v4.18a13.76,13.76,0,0,0,13.75,13.75h66.6a13.76,13.76,0,0,0,13.76-13.75V414.39a13.76,13.76,0,0,0-13.76-13.75h-66.6A13.76,13.76,0,0,0,2668.82,414.39ZM2568.57,699.23c-127.19-2.22-127.13-212.72,0-214.93C2695.15,484.77,2695.18,698.8,2568.57,699.23Z" />
              </g>
            </svg>

            {/* Social icons */}
            <div className="flex items-center gap-2">
              {[
                {
                  label: "X (Twitter)",
                  href: "https://x.com/nexaed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.26 5.632 5.904-5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  ),
                },
                {
                  label: "YouTube",
                  href: "https://youtube.com/@nexaed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ),
                },
                {
                  label: "GitHub",
                  href: "https://github.com/nexaed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                    </svg>
                  ),
                },
                {
                  label: "Discord",
                  href: "https://discord.gg/nexaed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.054a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                    </svg>
                  ),
                },
                {
                  label: "Instagram",
                  href: "https://instagram.com/nexaed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                    </svg>
                  ),
                },
                {
                  label: "Facebook",
                  href: "https://facebook.com/nexaed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  ),
                },
                {
                  label: "TikTok",
                  href: "https://tiktok.com/@nexaed",
                  icon: (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  ),
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-fd-border bg-fd-card text-fd-muted-foreground transition-colors hover:border-nexa-primary/40 hover:bg-nexa-primary/10 hover:text-nexa-primary"
                >
                  {s.icon}
                </a>
              ))}
            </div>

            {/* Bottom line */}
            <div className="flex flex-col items-center gap-1 text-center">
              <p className="text-[11px] text-fd-muted-foreground">
                © {new Date().getFullYear()} Nexa Ed. All rights reserved.
              </p>
              <p className="text-[11px] text-fd-muted-foreground">
                A product by{" "}
                <a
                  href="https://nexiumlabs.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-nexa-primary hover:underline"
                >
                  Nexium Labs
                </a>
              </p>
            </div>

          </div>
        </div>
      </footer>

    </main>
  );
}
