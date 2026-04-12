import type { ScaffoldOptions } from "../prompts";

// ── package.json ─────────────────────────────────────────────────────────────

export function renderPackageJson(opts: ScaffoldOptions): string {
  const deps: Record<string, string> = {
    "@nexa-ed/next":   "latest",
    "@nexa-ed/react":  "latest",
    "next":            "^15.0.0",
    "react":           "^19.0.0",
    "react-dom":       "^19.0.0",
    "@tanstack/react-query": "^5.0.0",
  };

  if (opts.authProvider === "workos") {
    deps["@workos-inc/authkit-nextjs"] = "^0.x.x";
    deps["@workos-inc/authkit-react"]  = "^0.x.x";
  } else if (opts.authProvider === "clerk") {
    deps["@clerk/nextjs"] = "^6.0.0";
  } else if (opts.authProvider === "nextauth") {
    deps["next-auth"] = "^5.0.0";
  }

  if (opts.features.convex) {
    deps["convex"]           = "^1.17.0";
    deps["@nexa-ed/convex"]  = "latest";
  }

  deps["next-themes"] = "^0.4.0";

  if (opts.uiLibrary === "shadcn") {
    deps["class-variance-authority"] = "^0.7.0";
    deps["clsx"]                     = "^2.1.1";
    deps["tailwind-merge"]           = "^2.5.2";
    deps["lucide-react"]             = "^0.460.0";
  }

  return JSON.stringify(
    {
      name:    opts.projectName,
      version: "0.1.0",
      private: true,
      scripts: {
        dev:         "next dev",
        build:       "next build",
        start:       "next start",
        "check-types": "tsc --noEmit",
      },
      dependencies: deps,
      devDependencies: {
        typescript:        "^5",
        "@types/node":     "^22",
        "@types/react":    "^19",
        "@types/react-dom": "^19",
        tailwindcss:       "^3",
        autoprefixer:      "^10",
        postcss:           "^8",
      },
    },
    null,
    2,
  ) + "\n";
}

// ── lib/nexa.ts ──────────────────────────────────────────────────────────────

export function renderNexaLib(opts: ScaffoldOptions): string {
  const lines: string[] = [];

  lines.push(`import { createNexa } from "@nexa-ed/next";`);

  if (opts.authProvider === "workos") {
    lines.push(`import { getUser } from "@workos-inc/authkit-nextjs";`);
  } else if (opts.authProvider === "clerk") {
    lines.push(`import { auth } from "@clerk/nextjs/server";`);
  } else if (opts.authProvider === "nextauth") {
    lines.push(`import { getServerSession } from "next-auth";`);
    lines.push(`import { authOptions } from "@/app/api/auth/[...nextauth]/route";`);
  }

  if (opts.features.convex) {
    lines.push(`import { ConvexHttpClient } from "convex/browser";`);
    if (opts.features.payments || opts.features.fileProcessing) {
      lines.push(`import { api } from "@/convex/_generated/api";`);
    }
    if (opts.features.payments || opts.features.fileProcessing) {
      lines.push(`import {`);
      if (opts.features.payments)       lines.push(`  createPaymentCompleteHandler,`);
      if (opts.features.fileProcessing) lines.push(`  createFileCompleteHandler,`);
      lines.push(`} from "@nexa-ed/convex/handlers";`);
    }
  }

  lines.push(``);

  if (opts.features.convex) {
    lines.push(`const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);`);
    lines.push(``);
  }

  // Build getUser
  let getUserBody: string;
  if (opts.authProvider === "workos") {
    getUserBody = [
      `    const { user } = await getUser();`,
      `    if (!user?.id) throw new Error("Unauthorized");`,
      `    return { userId: user.id };`,
    ].join("\n");
  } else if (opts.authProvider === "clerk") {
    getUserBody = [
      `    const { userId } = await auth();`,
      `    if (!userId) throw new Error("Unauthorized");`,
      `    return { userId };`,
    ].join("\n");
  } else if (opts.authProvider === "nextauth") {
    getUserBody = [
      `    const session = await getServerSession(authOptions);`,
      `    if (!session?.user?.id) throw new Error("Unauthorized");`,
      `    return { userId: session.user.id };`,
    ].join("\n");
  } else {
    getUserBody = [
      `    // TODO: resolve the current user from your session/JWT`,
      `    throw new Error("getUser not implemented");`,
    ].join("\n");
  }

  lines.push(`export const nexa = createNexa({`);
  lines.push(`  apiKey:        process.env.NEXA_API_KEY!,`);
  lines.push(`  webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,`);
  lines.push(``);
  lines.push(`  getUser: async () => {`);
  lines.push(getUserBody);
  lines.push(`  },`);

  if (opts.features.fileProcessing) {
    lines.push(``);
    if (opts.features.convex) {
      lines.push(`  onFileComplete: createFileCompleteHandler(convex, api),`);
    } else {
      lines.push(`  onFileComplete: async ({ fileId, userId }) => {`);
      lines.push(`    // TODO: sync the completed file result to your database`);
      lines.push(`    console.log(\`File \${fileId} completed for user \${userId}\`);`);
      lines.push(`  },`);
    }
  }

  if (opts.features.payments) {
    lines.push(``);
    if (opts.features.convex) {
      lines.push(`  onPaymentComplete: createPaymentCompleteHandler(convex, api),`);
    } else {
      lines.push(`  onPaymentComplete: async (event) => {`);
      lines.push(`    // TODO: persist the payment record to your database`);
      lines.push(`    console.log(\`Payment \${event.reference} completed\`);`);
      lines.push(`  },`);
    }
  }

  if (opts.features.emailProvisioning && opts.emailTier && opts.emailDomain) {
    lines.push(``);
    lines.push(`  email: {`);
    lines.push(`    tier:   "${opts.emailTier}",`);
    lines.push(`    domain: "${opts.emailDomain}",`);
    lines.push(`  },`);
  }

  lines.push(`});`);
  lines.push(``);

  return lines.join("\n");
}

// ── app/api/nexa/[...nexaed]/route.ts ────────────────────────────────────────

export function renderCatchAllRoute(): string {
  return `import { createRouteHandler } from "@nexa-ed/next";
import { nexa } from "@/lib/nexa";

export const { GET, POST } = createRouteHandler({ client: nexa });
`;
}

// ── .env.example ─────────────────────────────────────────────────────────────

export function renderEnvExample(opts: ScaffoldOptions): string {
  const lines = [
    `# ──────────────────────────────────────────────────────────────────────────`,
    `# Nexa — required`,
    `# Get these from https://nexa-ed.com/dashboard/settings`,
    `# ──────────────────────────────────────────────────────────────────────────`,
    `NEXA_API_KEY=nxk_live_YOUR_KEY_HERE`,
    `NEXA_WEBHOOK_SECRET=whsec_YOUR_SECRET_HERE`,
    ``,
    `# Optional — only needed when developing against a local Nexa instance`,
    `# NEXA_URL=http://localhost:3000`,
    ``,
  ];

  if (opts.authProvider === "workos") {
    lines.push(
      `# ──────────────────────────────────────────────────────────────────────────`,
      `# WorkOS AuthKit — https://dashboard.workos.com`,
      `# ──────────────────────────────────────────────────────────────────────────`,
      `WORKOS_API_KEY=sk_YOUR_WORKOS_API_KEY`,
      `WORKOS_CLIENT_ID=client_YOUR_WORKOS_CLIENT_ID`,
      `NEXT_PUBLIC_WORKOS_CLIENT_ID=client_YOUR_WORKOS_CLIENT_ID`,
      `WORKOS_REDIRECT_URI=http://localhost:3000/callback`,
      `WORKOS_COOKIE_PASSWORD=your_32_char_minimum_secret_for_iron_session_encryption`,
      ``,
    );
  } else if (opts.authProvider === "clerk") {
    lines.push(
      `# ──────────────────────────────────────────────────────────────────────────`,
      `# Clerk — https://dashboard.clerk.com`,
      `# ──────────────────────────────────────────────────────────────────────────`,
      `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY`,
      `CLERK_SECRET_KEY=sk_test_YOUR_KEY`,
      ``,
    );
  } else if (opts.authProvider === "nextauth") {
    lines.push(
      `# ──────────────────────────────────────────────────────────────────────────`,
      `# NextAuth`,
      `# ──────────────────────────────────────────────────────────────────────────`,
      `NEXTAUTH_SECRET=YOUR_SECRET_HERE`,
      `NEXTAUTH_URL=http://localhost:3000`,
      ``,
    );
  }

  if (opts.features.convex) {
    lines.push(
      `# ──────────────────────────────────────────────────────────────────────────`,
      `# Convex — https://dashboard.convex.dev`,
      `# ──────────────────────────────────────────────────────────────────────────`,
      `NEXT_PUBLIC_CONVEX_URL=https://YOUR_PROJECT.convex.cloud`,
      ``,
    );
  }

  if (opts.features.emailProvisioning) {
    lines.push(
      `# ──────────────────────────────────────────────────────────────────────────`,
      `# Student email provisioning`,
      `# Live key required — test keys (nxa_test_...) cannot deliver real emails`,
      `# ──────────────────────────────────────────────────────────────────────────`,
      `# NEXA_API_KEY must be set to your live key (see above)`,
      `# Email tier: ${opts.emailTier ?? "tier-1-nexa"}`,
      `# Email domain: ${opts.emailDomain ?? "yourschool.nexa-ed.com"}`,
      ``,
    );
  }

  return lines.join("\n");
}

// ── app/dashboard/page.tsx ───────────────────────────────────────────────────

export function renderDashboardPage(opts: ScaffoldOptions): string {
  const imports: string[] = [`"use client";`, ``];
  const components: string[] = [];

  if (opts.features.fileProcessing) {
    imports.push(`import { UploadZone, DocumentSelector, StatusBanner, useUploadFile } from "@nexa-ed/react";`);
    components.push(
      `      <UploadZone`,
      `        onUpload={async (file) => {`,
      `          const result = await uploadFile(file);`,
      `          if (result.fileId) setFileId(result.fileId);`,
      `          return { fileId: result.fileId ?? "" };`,
      `        }}`,
      `        onFileQueued={(id) => setFileId(id)}`,
      `        description="Upload a student results PDF to extract records."`,
      `      />`,
      `      {fileId && <StatusBanner fileId={fileId} />}`,
    );
  }

  if (opts.features.fileProcessing) {
    imports.push(`import { useState } from "react";`);
  }

  const body = opts.features.fileProcessing
    ? [
        `  const { uploadFile } = useUploadFile();`,
        `  const [fileId, setFileId] = useState<string | null>(null);`,
        ``,
        `  return (`,
        `    <main className="max-w-4xl mx-auto p-8 space-y-6">`,
        `      <h1 className="text-2xl font-bold">Dashboard</h1>`,
        ...components.map((l) => `      ${l}`),
        `    </main>`,
        `  );`,
      ]
    : [
        `  return (`,
        `    <main className="max-w-4xl mx-auto p-8">`,
        `      <h1 className="text-2xl font-bold">Dashboard</h1>`,
        `      <p className="text-gray-500 mt-2">Your Nexa-connected school app is ready.</p>`,
        `    </main>`,
        `  );`,
      ];

  return [
    ...imports,
    ``,
    `export default function DashboardPage() {`,
    ...body,
    `}`,
    ``,
  ].join("\n");
}

// ── app/providers.tsx ────────────────────────────────────────────────────────

export function renderProvidersFile(opts: ScaffoldOptions): string {
  const lines: string[] = [`"use client";`, ``];

  lines.push(`import type { ReactNode } from "react";`);
  lines.push(`import { ThemeProvider } from "next-themes";`);
  lines.push(`import { QueryClient, QueryClientProvider } from "@tanstack/react-query";`);
  lines.push(`import { NexaProvider } from "@nexa-ed/react";`);

  if (opts.authProvider === "workos") {
    lines.push(`import { AuthKitProvider } from "@workos-inc/authkit-react";`);
  } else if (opts.authProvider === "clerk") {
    lines.push(`import { ClerkProvider } from "@clerk/nextjs";`);
  }

  if (opts.features.convex) {
    lines.push(`import { ConvexProvider, ConvexReactClient } from "convex/react";`);
  }

  lines.push(``);
  lines.push(`const queryClient = new QueryClient();`);

  if (opts.features.convex) {
    lines.push(`const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);`);
  }

  lines.push(``);
  lines.push(`export function Providers({ children }: { children: ReactNode }) {`);

  const wrappers: Array<[string, string]> = [];

  wrappers.push([
    `<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>`,
    `</ThemeProvider>`,
  ]);

  if (opts.authProvider === "workos") {
    wrappers.push([
      `<AuthKitProvider clientId={process.env.NEXT_PUBLIC_WORKOS_CLIENT_ID!}>`,
      `</AuthKitProvider>`,
    ]);
  } else if (opts.authProvider === "clerk") {
    wrappers.push(["<ClerkProvider>", "</ClerkProvider>"]);
  }
  if (opts.features.convex) {
    wrappers.push([`<ConvexProvider client={convex}>`, `</ConvexProvider>`]);
  }
  wrappers.push(["<QueryClientProvider client={queryClient}>", "</QueryClientProvider>"]);
  wrappers.push(["<NexaProvider>", "</NexaProvider>"]);

  const indent = (n: number) => "  ".repeat(n);
  lines.push(`  return (`);
  wrappers.forEach(([open], i) => lines.push(`${indent(i + 2)}${open}`));
  lines.push(`${indent(wrappers.length + 2)}{children}`);
  wrappers.slice().reverse().forEach(([, close], i) =>
    lines.push(`${indent(wrappers.length - i + 1)}${close}`)
  );
  lines.push(`  );`);
  lines.push(`}`);
  lines.push(``);

  return lines.join("\n");
}

// ── app/layout.tsx ───────────────────────────────────────────────────────────

export function renderRootLayout(opts: ScaffoldOptions): string {
  const displayName = opts.projectName
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c: string) => c.toUpperCase());

  return `import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "${displayName}",
  description: "School management portal powered by Nexa Ed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
`;
}
