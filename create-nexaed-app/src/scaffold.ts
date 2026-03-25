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
  await write(projectDir, "app/layout.tsx",         renderRootLayout(opts));
  await write(projectDir, "app/providers.tsx",       renderProvidersFile(opts));
  await write(projectDir, "app/dashboard/page.tsx",  renderDashboardPage(opts));

  // ── Nexa-ed SDK wiring ───────────────────────────────────────────────────────
  await write(projectDir, "lib/nexa.ts",                         renderNexaLib(opts));
  await write(projectDir, "app/api/nexa/[...nexaed]/route.ts",   renderCatchAllRoute());

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
