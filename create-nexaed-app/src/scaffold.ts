import fs from "fs-extra";
import path from "node:path";
import type { ScaffoldOptions } from "./prompts";
import {
  renderPackageJson,
  renderNexaLib,
  renderCatchAllRoute,
  renderEnvExample,
  renderDashboardPage,
  renderProvidersFile,
  renderRootLayout,
} from "./templates";

export async function scaffold(opts: ScaffoldOptions): Promise<void> {
  const { projectDir } = opts;

  // Refuse to overwrite a non-empty directory
  if (await fs.pathExists(projectDir)) {
    const entries = await fs.readdir(projectDir);
    if (entries.length > 0) {
      throw new Error(
        `Directory "${opts.projectName}" already exists and is not empty.`,
      );
    }
  }

  await fs.ensureDir(projectDir);

  // ── Root files ───────────────────────────────────────────────────────────────
  await write(projectDir, "package.json",  renderPackageJson(opts));
  await write(projectDir, ".env.example",  renderEnvExample(opts));
  await write(projectDir, ".env.local",    renderEnvLocal(opts));
  await write(projectDir, ".gitignore",    gitignore());
  await write(projectDir, "next.config.ts", nextConfig());

  // ── App router structure ─────────────────────────────────────────────────────
  await write(projectDir, "app/globals.css",         globalsCss(opts));
  await write(projectDir, "app/layout.tsx",          renderRootLayout(opts));
  await write(projectDir, "app/page.tsx",            renderRootPage(opts));
  await write(projectDir, "app/providers.tsx",       renderProvidersFile(opts));
  await write(projectDir, "app/dashboard/page.tsx",  renderDashboardPage(opts));

  // ── Nexa-ed SDK wiring ───────────────────────────────────────────────────────
  await write(projectDir, "lib/nexa.ts",                         renderNexaLib(opts));
  await write(projectDir, "app/api/nexa/[...nexaed]/route.ts",   renderCatchAllRoute());

  // ── Tailwind + PostCSS ───────────────────────────────────────────────────────
  await write(projectDir, "tailwind.config.ts", tailwindConfig(opts));
  await write(projectDir, "postcss.config.mjs", postcssConfig());

  // ── Theme toggle component ───────────────────────────────────────────────────
  await write(projectDir, "components/ThemeToggle.tsx", renderThemeToggle());

  // ── UI library extras ─────────────────────────────────────────────────────────
  if (opts.uiLibrary === "shadcn") {
    await write(projectDir, "components.json",  renderComponentsJson());
    await write(projectDir, "lib/utils.ts",     renderLibUtils());
  }

  // ── Middleware ────────────────────────────────────────────────────────────────
  await write(projectDir, "middleware.ts", renderMiddleware(opts));

  // ── Auth callback route (WorkOS only) ────────────────────────────────────────
  if (opts.authProvider === "workos") {
    await write(projectDir, "app/callback/route.ts", renderWorkosCallbackRoute());
  }

  // ── tsconfig ─────────────────────────────────────────────────────────────────
  await write(projectDir, "tsconfig.json", tsconfig());
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function write(dir: string, relPath: string, content: string) {
  const full = path.join(dir, relPath);
  await fs.ensureDir(path.dirname(full));
  await fs.writeFile(full, content, "utf8");
}

function renderEnvLocal(opts: ScaffoldOptions): string {
  const lines = [
    `# Nexa`,
    `NEXA_API_KEY=${opts.apiKey || "nxk_live_YOUR_KEY_HERE"}`,
    `NEXA_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE`,
    ``,
  ];
  if (opts.authProvider === "workos") {
    lines.push(
      `# WorkOS AuthKit`,
      `WORKOS_API_KEY=sk_YOUR_KEY`,
      `WORKOS_CLIENT_ID=client_YOUR_CLIENT_ID`,
      `NEXT_PUBLIC_WORKOS_CLIENT_ID=client_YOUR_CLIENT_ID`,
      `WORKOS_REDIRECT_URI=http://localhost:3000/callback`,
      `WORKOS_COOKIE_PASSWORD=your_32_char_minimum_secret_for_iron_session_encryption`,
      ``,
    );
  }
  if (opts.authProvider === "clerk") {
    lines.push(
      `# Clerk`,
      `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY`,
      `CLERK_SECRET_KEY=sk_test_YOUR_KEY`,
      ``,
    );
  }
  if (opts.features.convex) {
    lines.push(`# Convex`, `NEXT_PUBLIC_CONVEX_URL=https://YOUR_PROJECT.convex.cloud`, ``);
  }
  return lines.join("\n");
}

function gitignore(): string {
  return [
    ".env.local",
    ".env*.local",
    "node_modules/",
    ".next/",
    "out/",
    "dist/",
    ".DS_Store",
  ].join("\n") + "\n";
}

function globalsCss(opts: ScaffoldOptions): string {
  const shadcnRadius = opts.uiLibrary === "shadcn" ? `\n    --radius: 1rem;` : "";
  const borderReset = opts.uiLibrary === "shadcn"
    ? `\n  * {\n    @apply border-border;\n  }\n` : "";

  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  /* ── Light theme (default :root) ── */
  :root {
    --background: 240 20% 99%;
    --foreground: 220 15% 12%;

    --card: 0 0% 100%;
    --card-foreground: 220 15% 12%;

    --popover: 0 0% 100%;
    --popover-foreground: 220 15% 12%;

    --muted: 220 15% 95%;
    --muted-foreground: 220 10% 45%;

    --border: 220 15% 90%;
    --input: 220 15% 92%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;

    --nexa-primary: 158 64% 48%;
    --nexa-primary-foreground: 0 0% 8%;
    --nexa-primary-dark: 158 64% 36%;
    --nexa-primary-glow: 167 82% 42%;

    --primary: 158 64% 48%;
    --primary-foreground: 0 0% 8%;

    --secondary: 142 76% 34%;
    --secondary-foreground: 0 0% 100%;

    --accent: 158 64% 48%;
    --accent-foreground: 0 0% 100%;

    --ring: 158 64% 48%;

    --nexa-surface: 220 15% 96%;
    --nexa-border: 220 15% 90%;

    --gradient-primary: linear-gradient(135deg, hsl(158 64% 48%), hsl(167 82% 42%));
    --gradient-glow: linear-gradient(135deg, hsl(158 64% 48% / 0.12), hsl(167 82% 42% / 0.06));

    --glass-bg: rgba(255, 255, 255, 0.75);
    --glass-border: rgba(30, 30, 30, 0.08);${shadcnRadius}
  }

  /* ── Dark theme — matches Nexa platform exactly ── */
  .dark {
    --background: 0 0% 1%;
    --foreground: 0 0% 98%;

    --card: 0 0% 4%;
    --card-foreground: 0 0% 98%;

    --popover: 0 0% 4%;
    --popover-foreground: 0 0% 98%;

    --muted: 0 0% 8%;
    --muted-foreground: 0 0% 65%;

    --border: 0 0% 12%;
    --input: 0 0% 12%;

    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 98%;

    --nexa-primary: 158 64% 52%;
    --nexa-primary-foreground: 0 0% 8%;
    --nexa-primary-dark: 158 64% 40%;
    --nexa-primary-glow: 167 82% 45%;

    --primary: 158 64% 52%;
    --primary-foreground: 0 0% 8%;

    --secondary: 142 76% 36%;
    --secondary-foreground: 0 0% 98%;

    --accent: 158 64% 52%;
    --accent-foreground: 0 0% 98%;

    --ring: 158 64% 52%;

    --nexa-surface: 0 0% 4%;
    --nexa-border: 0 0% 12%;

    --gradient-primary: linear-gradient(135deg, hsl(158 64% 52%), hsl(167 82% 45%));
    --gradient-glow: linear-gradient(135deg, hsl(158 64% 52% / 0.15), hsl(167 82% 45% / 0.08));

    --glass-bg: rgba(255, 255, 255, 0.04);
    --glass-border: rgba(255, 255, 255, 0.08);
  }
${borderReset}
  html {
    @apply antialiased;
  }

  body {
    @apply bg-background text-foreground;
  }
}
`;
}

function renderRootPage(opts: ScaffoldOptions): string {
  const displayName = opts.projectName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const featureItems: { icon: string; label: string; desc: string }[] = [];
  if (opts.features.fileProcessing)
    featureItems.push({ icon: "📄", label: "Results Processing", desc: "Upload PDFs and extract student records automatically." });
  if (opts.features.payments)
    featureItems.push({ icon: "💳", label: "Payments", desc: "Collect school fees via Paystack with one integration." });
  if (opts.features.emailProvisioning)
    featureItems.push({ icon: "📧", label: "Student Emails", desc: "Provision school email accounts at scale." });
  if (opts.features.convex)
    featureItems.push({ icon: "⚡", label: "Live Backend", desc: "Reactive data sync powered by Convex." });

  const featureGrid = featureItems.length === 0 ? "" : `
        {/* Features */}
        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-${Math.min(featureItems.length, 3)} w-full max-w-3xl">
${featureItems.map((f) => `          <div className="rounded-xl border border-[hsl(var(--nexa-border))] bg-[hsl(var(--nexa-surface))] p-5 transition-colors hover:border-[hsl(var(--nexa-primary)/0.4)]">
            <span className="text-2xl">${f.icon}</span>
            <h3 className="mt-3 text-sm font-semibold text-foreground">${f.label}</h3>
            <p className="mt-1 text-sm text-foreground/60">${f.desc}</p>
          </div>`).join("\n")}
        </div>`;

  return `import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Nav */}
      <header className="border-b border-[hsl(var(--nexa-border))] bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold text-foreground">${displayName}</span>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/dashboard"
              className="rounded-lg bg-[hsl(var(--nexa-primary))] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--nexa-primary-dark))]"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nexa-border))] bg-[hsl(var(--nexa-surface))] px-3 py-1 text-xs font-medium text-foreground/60">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--nexa-primary))]" />
          Powered by Nexa Ed
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Welcome to ${displayName}
        </h1>
        <p className="mt-4 max-w-md text-base text-foreground/60">
          Your school management portal is ready. Sign in to access the dashboard,
          manage students, and use all your configured features.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg bg-[hsl(var(--nexa-primary))] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[hsl(var(--nexa-primary-dark))]"
          >
            Go to Dashboard
          </Link>
          <a
            href="https://docs.nexa-ed.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg border border-[hsl(var(--nexa-border))] bg-background px-5 py-2.5 text-sm font-semibold text-foreground/80 shadow-sm transition-colors hover:bg-[hsl(var(--nexa-surface))]"
          >
            View Docs
          </a>
        </div>
${featureGrid}
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--nexa-border))] py-6 text-center text-xs text-foreground/40">
        <span>© ${new Date().getFullYear()} ${displayName}</span>
        <span className="mx-2 opacity-30">·</span>
        <span>
          Built with{" "}
          <a
            href="https://nexa-ed.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[hsl(var(--nexa-primary))] hover:underline"
          >
            Nexa Ed
          </a>
          {" "}—{" "}
          <a
            href="https://nexiumlabs.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline hover:text-foreground/60 transition-colors"
          >
            a product by Nexium Labs
          </a>
        </span>
      </footer>
    </div>
  );
}
`;
}

function renderMiddleware(opts: ScaffoldOptions): string {
  if (opts.authProvider === "workos") {
    return `import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

export default authkitMiddleware({
  redirectUri: process.env.WORKOS_REDIRECT_URI,
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: ["/", "/api/nexa/(.*)"],
  },
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
`;
  }

  if (opts.authProvider === "clerk") {
    return `import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) await auth.protect();
});

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
`;
  }

  if (opts.authProvider === "nextauth") {
    return `export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/dashboard/:path*"],
};
`;
  }

  // no auth — passthrough
  return `import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};
`;
}

function renderWorkosCallbackRoute(): string {
  return `import { handleAuth } from "@workos-inc/authkit-nextjs";

export const GET = handleAuth();
`;
}

function tailwindConfig(opts: ScaffoldOptions): string {
  const darkMode = `\n  darkMode: ["class"],`;

  const shadcnColors = opts.uiLibrary === "shadcn" ? `
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",` : "";

  const shadcnRadius = opts.uiLibrary === "shadcn" ? `
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },` : "";

  return `import type { Config } from "tailwindcss";

export default {${darkMode}
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./node_modules/@nexa-ed/react/dist/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        "nexa-primary": "hsl(var(--nexa-primary) / <alpha-value>)",
        "nexa-primary-dark": "hsl(var(--nexa-primary-dark) / <alpha-value>)",
        "nexa-surface": "hsl(var(--nexa-surface) / <alpha-value>)",
        "nexa-border": "hsl(var(--nexa-border) / <alpha-value>)",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",${shadcnColors}
      },${shadcnRadius}
    },
  },
  plugins: [],
} satisfies Config;
`;
}

function renderThemeToggle(): string {
  return `"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = resolvedTheme !== "light";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle theme"
      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[hsl(var(--nexa-border))] bg-transparent text-foreground/60 transition-colors hover:border-[hsl(var(--nexa-primary)/0.4)] hover:text-[hsl(var(--nexa-primary))]"
    >
      {isDark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}
`;
}

function renderComponentsJson(): string {
  return JSON.stringify(
    {
      $schema: "https://ui.shadcn.com/schema.json",
      style: "new-york",
      rsc: true,
      tsx: true,
      tailwind: {
        config: "tailwind.config.ts",
        css: "app/globals.css",
        baseColor: "neutral",
        cssVariables: true,
        prefix: "",
      },
      aliases: {
        components: "@/components",
        utils: "@/lib/utils",
        ui: "@/components/ui",
        lib: "@/lib",
        hooks: "@/hooks",
      },
      iconLibrary: "lucide",
    },
    null,
    2,
  ) + "\n";
}

function renderLibUtils(): string {
  return `import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
`;
}

function postcssConfig(): string {
  return `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
}

function nextConfig(): string {
  return `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* Nexa-ed SDK requires server components to be able to use Node.js APIs */
  experimental: {},
};

export default nextConfig;
`;
}

function tsconfig(): string {
  return JSON.stringify(
    {
      compilerOptions: {
        target: "ES2017",
        lib: ["dom", "dom.iterable", "esnext"],
        allowJs: true,
        skipLibCheck: true,
        strict: true,
        noEmit: true,
        esModuleInterop: true,
        module: "esnext",
        moduleResolution: "bundler",
        resolveJsonModule: true,
        isolatedModules: true,
        jsx: "preserve",
        incremental: true,
        plugins: [{ name: "next" }],
        paths: { "@/*": ["./*"] },
      },
      include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
      exclude: ["node_modules"],
    },
    null,
    2,
  ) + "\n";
}
