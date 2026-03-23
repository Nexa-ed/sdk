# Nexa Education Platform — SDK

The `@nexa-ed` SDK lets school developers integrate with the Nexa platform in minutes. It covers file processing, OCR results, payments, webhooks, and UI components — all with full TypeScript types.

**[Documentation](https://docs.nexa-ed.com)** — full guides, API reference, and examples.

---

## Packages

| Package | npm | Description |
|---------|-----|-------------|
| [`@nexa-ed/sdk`](./core/) | Core client | `NexaClient` — all API modules (files, payments, documents, webhooks, services) |
| [`@nexa-ed/next`](./next/) | Next.js adapter | `createNexa` + `createRouteHandler` — one-file setup for Next.js App Router |
| [`@nexa-ed/react`](./react/) | React components | Upload, payment, results viewer, and progress UI components |
| [`@nexa-ed/convex`](./convex/) | Convex adapter | Schema fragments, mutations, queries, and webhook handler factories |
| [`@nexa-ed/node`](./node/) | Node.js adapter | Express, Fastify, and Hono adapters |
| [`create-nexaed-app`](./create-nexaed-app/) | CLI scaffolder | `npx create-nexaed-app` — scaffold a Nexa-connected school app in seconds |

---

## Quick Start

### Next.js (recommended)

**1. Install**

```bash
npm install @nexa-ed/next @nexa-ed/react
# or
pnpm add @nexa-ed/next @nexa-ed/react
```

**2. Create your Nexa client** — `lib/nexa.ts`

```ts
import { createNexa } from "@nexa-ed/next";

export const nexa = createNexa({
  apiKey: process.env.NEXA_API_KEY!,
  webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
  getUser: async () => {
    // return the current user from your auth provider
    const { userId } = await auth();
    return { id: userId! };
  },
  onFileComplete: async ({ fileId, userId }) => {
    // called when OCR processing finishes — persist results to your DB
  },
});
```

**3. Mount the catch-all route** — `app/api/nexa/[...nexaed]/route.ts`

```ts
import { createRouteHandler } from "@nexa-ed/next";
import { nexa } from "@/lib/nexa";

export const { GET, POST } = createRouteHandler({ client: nexa });
```

That's it. All Nexa endpoints (progress SSE, webhooks, file forwarding, payments) are handled automatically.

---

### CLI Scaffolder

Scaffold a complete school app from scratch:

```bash
npx create-nexaed-app my-school
# or
pnpm create nexaed-app my-school
```

The CLI prompts for your school name, auth provider (Clerk / NextAuth / none), and which features to enable. It generates a ready-to-run Next.js app with `lib/nexa.ts`, the catch-all route, a dashboard page, and a pre-filled `.env.example`.

---

## Package Details

### `@nexa-ed/sdk` — Core Client

The framework-agnostic base. `@nexa-ed/next` and `@nexa-ed/node` re-export everything from here — you typically don't need to install this directly.

```ts
import { NexaClient } from "@nexa-ed/sdk";

const nexa = new NexaClient({ apiKey, webhookSecret });

// Files & OCR
nexa.files.submit({ fileUrl, userId, extractionType });
nexa.files.streamProgress(fileId, userId);          // AsyncGenerator<FileProgressEvent>

// Payments (Paystack)
nexa.payments.initialize({ email, amount, metadata });
nexa.payments.verify(reference);
nexa.payments.sync(reference);
nexa.payments.getStatus(reference);
nexa.payments.getConfig();

// Student Records / Documents
nexa.documents.getUserDocuments(userId);
nexa.documents.getStudentRecords(userId, fileId, options);
nexa.documents.updateRecord(userId, recordId, data);
nexa.documents.deleteRecord(userId, recordId);
nexa.documents.refinePage(userId, fileId, chunkId, pageNumber);
nexa.documents.confirmSubjectGroups(userId, groups);

// Webhooks
nexa.webhooks.verify(request);                      // → WebhookEvent

// Services
nexa.services.list();
```

---

### `@nexa-ed/next` — Next.js Adapter

Wraps `@nexa-ed/sdk` with Next.js App Router-specific helpers. Re-exports the full SDK, so this is the only package most Next.js apps need.

**Routes handled by `createRouteHandler`:**

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/nexa/progress/:fileId` | SSE stream — live OCR progress |
| `POST` | `/api/nexa/rpc` | oRPC data queries |
| `POST` | `/api/nexa/webhook` | Verified webhook events |
| `POST` | `/api/nexa/file-processing/forward` | Forward file to Nexa pipeline |
| `POST` | `/api/nexa/payments/initialize` | Initialize a payment |
| `GET` | `/api/nexa/payments/status/:ref` | Check payment status |
| `GET` | `/api/nexa/payments/transactions` | List transactions |
| `GET` | `/api/nexa/payments/stats` | Payment stats |
| `GET` | `/api/nexa/payments/config` | Payment gateway config |
| `POST` | `/api/nexa/upload` | File upload |

---

### `@nexa-ed/react` — UI Components

Pre-built, unstyled (pure Tailwind) React components for the full OCR review and payment flow.

```tsx
import {
  // File processing & results
  UploadZone,
  DocumentSelector,
  StatusBanner,
  StudentRecordsTable,
  RecordDataGrid,
  PageDetailPanel,
  PipelineTimeline,
  StatsPanel,
  ChunkPageMap,
  AnalysisJobPanel,
  ResultsViewerSheet,
  // Payments
  NexaPaymentWidget,
  EnrollmentPaymentFlow,
  PaymentConfigPanel,
  PaymentStatusDashboard,
  // Hook
  useUploadFile,
} from "@nexa-ed/react";
```

**Peer dependencies:** `react >= 19`, `@tanstack/react-query >= 5`

---

### `@nexa-ed/convex` — Convex Adapter

Schema fragments and callback factories for tenant apps using [Convex](https://convex.dev) as their database.

```ts
// convex/schema.ts
import { defineSchema } from "convex/server";
import { nexaPaymentsSchema, nexaFilesSchema } from "@nexa-ed/convex/schema";

export default defineSchema({
  ...nexaPaymentsSchema,
  ...nexaFilesSchema,
});

// convex/nexa.ts
import {
  upsertPaymentFromNexa,
  upsertFileResultFromNexa,
  getPaymentByReference,
  getPaymentsByEmail,
  getFileResult,
  getFileResultsByUser,
  createPaymentCompleteHandler,
  createFileCompleteHandler,
} from "@nexa-ed/convex";
```

**Peer dependencies:** `convex >= 1.9.0`

---

### `@nexa-ed/node` — Node.js / Framework Adapters

Use Nexa in Express, Fastify, or Hono servers.

```ts
// Hono
import { nexaHono } from "@nexa-ed/node/hono";
app.route("/api/nexa", nexaHono({ client: nexa }));

// Express
import { nexaExpress } from "@nexa-ed/node/express";
app.use("/api/nexa", nexaExpress({ client: nexa }));

// Fastify
import { nexaFastify } from "@nexa-ed/node/fastify";
await fastify.register(nexaFastify, { client: nexa, prefix: "/api/nexa" });
```

**Peer dependencies:** at least one of `hono >= 4`, `express >= 4`, `fastify >= 5` (all optional)

---

## Environment Variables

```env
# Required
NEXA_API_KEY=             # Your tenant API key from the Nexa platform
NEXA_WEBHOOK_SECRET=      # Webhook signing secret from the Nexa dashboard
```

---

## Versioning & Publishing

This SDK uses [Changesets](https://github.com/changesets/changesets) for versioning.

```bash
# Create a changeset for your PR
pnpm changeset

# Bump versions from pending changesets
pnpm version-packages

# Publish to npm
pnpm release
```

Packages are published automatically by the GitHub Actions workflow (`.github/workflows/publish-sdk.yml`) when a version tag is pushed:

```
sdk-core-v1.0.0
sdk-next-v1.0.0
sdk-react-v1.0.0
sdk-convex-v1.0.0
```

---

## Commit Convention

All SDK commits use the `sdk:` prefix for easy filtering:

```
sdk(core): add payments.getRecent() procedure
sdk(next): fix SSE proxy headers for Safari
sdk(react): migrate StudentRecordsGrid component
sdk(convex): add getFileResultsByUser query
sdk(node): add Fastify adapter
sdk(cli): add NextAuth template option
sdk(docs): add webhooks reference page
```

---

## License

MIT — see [LICENSE](./LICENSE)
