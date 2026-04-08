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
  await write(projectDir, "app/globals.css",         globalsCss());
  await write(projectDir, "app/layout.tsx",          renderRootLayout(opts));
  await write(projectDir, "app/page.tsx",            renderRootPage(opts));
  await write(projectDir, "app/providers.tsx",       renderProvidersFile(opts));
  await write(projectDir, "app/dashboard/page.tsx",  renderDashboardPage(opts));

  // ── Nexa-ed SDK wiring ───────────────────────────────────────────────────────
  await write(projectDir, "lib/nexa.ts",                         renderNexaLib(opts));
  await write(projectDir, "app/api/nexa/[...nexaed]/route.ts",   renderCatchAllRoute());

  // ── Tailwind + PostCSS ───────────────────────────────────────────────────────
  await write(projectDir, "tailwind.config.ts", tailwindConfig());
  await write(projectDir, "postcss.config.mjs", postcssConfig());

  // ── Middleware ────────────────────────────────────────────────────────────────
  await write(projectDir, "middleware.ts", renderMiddleware(opts));

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

function globalsCss(): string {
  return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --nexa-primary: 158 64% 52%;
    --nexa-primary-foreground: 0 0% 100%;
    --nexa-primary-dark: 158 64% 40%;
    --nexa-surface: 158 30% 97%;
    --nexa-border: 158 20% 88%;
  }

  html {
    @apply antialiased;
  }

  body {
    @apply bg-white text-gray-900;
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
            <h3 className="mt-3 text-sm font-semibold text-gray-900">${f.label}</h3>
            <p className="mt-1 text-sm text-gray-500">${f.desc}</p>
          </div>`).join("\n")}
        </div>`;

  return `import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Nav */}
      <header className="border-b border-[hsl(var(--nexa-border))] bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold text-gray-900">${displayName}</span>
          <Link
            href="/dashboard"
            className="rounded-lg bg-[hsl(var(--nexa-primary))] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[hsl(var(--nexa-primary-dark))]"
          >
            Dashboard →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[hsl(var(--nexa-border))] bg-[hsl(var(--nexa-surface))] px-3 py-1 text-xs font-medium text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--nexa-primary))]" />
          Powered by Nexa Ed
        </div>

        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          Welcome to ${displayName}
        </h1>
        <p className="mt-4 max-w-md text-base text-gray-500">
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
            className="rounded-lg border border-[hsl(var(--nexa-border))] bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-[hsl(var(--nexa-surface))]"
          >
            View Docs
          </a>
        </div>
${featureGrid}
      </main>

      {/* Footer */}
      <footer className="border-t border-[hsl(var(--nexa-border))] py-6 text-center text-xs text-gray-400">
        Built with{" "}
        <a
          href="https://nexa-ed.com"
          target="_blank"
          rel="noopener noreferrer"
          className="text-[hsl(var(--nexa-primary))] hover:underline"
        >
          Nexa Ed SDK
        </a>
      </footer>
    </div>
  );
}
`;
}

function renderMiddleware(opts: ScaffoldOptions): string {
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

function tailwindConfig(): string {
  return `import type { Config } from "tailwindcss";

export default {
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
      },
    },
  },
  plugins: [],
} satisfies Config;
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
