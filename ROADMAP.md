# Nexa SDK — Build Roadmap

This document tracks every remaining step to bring the `@nexa-ed` SDK from
its current scaffolded state to a complete, documented, privately-published
package suite.

---

## Current State (as of 2026-03-21)

Four packages live in `sdk/` and pass full TypeScript type-checking:

| Package | Status | Notes |
|---------|--------|-------|
| `@nexa-ed/sdk` | ✅ Complete | NexaClient, all modules typed; payments module extended with `sync`, `getStatus`, `getConfig` typed |
| `@nexa-ed/next` | ✅ Complete | createNexa + createRouteHandler; all routes handled (progress, rpc, webhook, file-processing/forward, payments/forward, upload, **payments/config, payments/initialize, payments/status, payments/transactions, payments/stats**) |
| `@nexa-ed/react` | ✅ Complete | All components: UploadZone, DocumentSelector, StatusBanner, StudentRecordsTable, RecordDataGrid, PageDetailPanel, PipelineTimeline, StatsPanel, ChunkPageMap, AnalysisJobPanel, ResultsViewerSheet; `useUploadFile` hook; **Payment components: NexaPaymentWidget, EnrollmentPaymentFlow, PaymentConfigPanel, PaymentStatusDashboard** |
| `@nexa-ed/convex` | ✅ Complete | `nexaPaymentsSchema`, `nexaFilesSchema`, `upsertPaymentFromNexa`, `upsertFileResultFromNexa`, `getPaymentByReference`, `getPaymentsByEmail`, `getFileResult`, `createPaymentCompleteHandler`, `createFileCompleteHandler` — wired into Loretto as reference impl |

### Loretto migration — ✅ Fully complete

Every Nexa call in `apps/loretto` now goes through the SDK. No raw HTTP helpers remain.
All three SDK packages type-check clean against Loretto.

A tenant app installs `@nexa-ed/next` and writes **two files**:

```ts
// lib/nexa.ts
export const nexa = createNexa({
  apiKey: process.env.NEXA_API_KEY!,
  webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
  getUser: async () => { ... },
  onFileComplete: async ({ fileId, userId }) => { ... },
});

// app/api/nexa/[...nexaed]/route.ts
export const { GET, POST } = createRouteHandler({ client: nexa });
```

---

## Phase 1 — `@nexa-ed/react` Component Migration

> **Goal:** Move the OCR review UI from `packages/ocr-ui` into `sdk/react/src/`
> so tenant apps can get a fully functional teacher dashboard with zero UI work.

### Step 1.1 — Decouple `ocr-ui` from internal packages

`packages/ocr-ui` currently imports from `@repo/api` and `@repo/query` (internal
workspace packages). Before migrating to `sdk/react`, these dependencies must be
replaced with the public SDK types from `@nexa-ed/sdk`.

**Files to update in `packages/ocr-ui`:**
- All components that import from `@repo/api` → import types from `@nexa-ed/sdk`
- All hooks that call `@repo/query` hooks → accept data as props or expose hook
  options so the caller controls fetching

### Step 1.2 — Migrate components to `sdk/react`

Copy (not move yet — loretto still uses `packages/ocr-ui`) each component to
`sdk/react/src/components/`:

```
sdk/react/src/
  components/
    DocumentViewer.tsx        ← wraps PipelineTimeline + StatusBanner
    StudentRecordsGrid.tsx    ← RecordDataGrid with full CRUD
    PageDetailPanel.tsx       ← per-page record review
    ProgressTracker.tsx       ← live SSE progress bar via /api/nexa/progress
    RefinementButton.tsx      ← trigger LLM re-refinement
    UploadZone.tsx            ← drag-and-drop wired to nexa.files.submit()
    StatusBanner.tsx          ← processing status banner
  hooks/
    useFileProgress.ts        ← EventSource hook for /api/nexa/progress/:fileId
    useDocuments.ts           ← TanStack Query wrappers for nexa.documents.*
  index.ts                    ← barrel export
```

### Step 1.3 — Export hooks from `@nexa-ed/react`

`useFileProgress` is the key hook — it connects the browser's EventSource to the
`/api/nexa/progress/:fileId` SSE proxy, typed with `FileProgressEvent`.

```ts
import { useFileProgress } from "@nexa-ed/react";

const { progress, isComplete, records } = useFileProgress(fileId);
```

### Step 1.4 — Write docs page: "UI Components"

Immediately after Step 1.3.
Doc page: `docs/web/content/docs/react/components.mdx`

---

## Phase 1.5 — `@nexa-ed/convex` Convex Integration ✅

> **Complete.** `sdk/convex/` — schema fragments, mutations, queries, and callback factories.

- [x] `sdk/convex/src/schema.ts` — `nexaPaymentsSchema`, `nexaFilesSchema`
- [x] `sdk/convex/src/mutations.ts` — `upsertPaymentFromNexa`, `upsertFileResultFromNexa`
- [x] `sdk/convex/src/queries.ts` — `getPaymentByReference`, `getPaymentsByEmail`, `getFileResult`, `getFileResultsByUser`
- [x] `sdk/convex/src/handlers.ts` — `createPaymentCompleteHandler`, `createFileCompleteHandler`
- [x] Wired into Loretto: `nexaFilesSchema` in schema builder, `convex/nexa.ts` re-exports, `onFileComplete` uses `createFileCompleteHandler`

---

## Phase 2 — `create-nexaed-app` CLI Scaffolder ✅

> **Goal:** A developer can scaffold a complete Nexa-connected school app with
> one command, like `create-next-app` but purpose-built for Nexa tenants.
>
> **Complete.** `sdk/create-nexaed-app` (moved from `packages/`) — interactive prompts (auth provider,
> features, API key), generates a full Next.js app skeleton with `lib/nexa.ts`,
> the catch-all route, providers, dashboard page, `.env.example`, and conditional
> Convex/payments/file-processing wiring.

```bash
pnpm create nexaed-app my-school
# or
npx create-nexaed-app my-school
```

### Step 2.1 — Create `packages/create-nexaed-app/`

```
packages/create-nexaed-app/
  src/
    index.ts          ← bin entry point
    prompts.ts        ← interactive questions
    scaffold.ts       ← file generator
    templates/
      base/           ← Next.js 15 app skeleton
        app/
          api/nexa/[...nexaed]/route.ts
          dashboard/page.tsx
        lib/
          nexa.ts
        .env.example
        package.json.template
  package.json        ← bin: { "create-nexaed-app": "./dist/index.js" }
```

### Step 2.2 — Interactive prompts

The CLI asks:
1. School name (used as the app name)
2. Auth provider: Clerk / NextAuth / none
3. Features to include:
   - [ ] File processing + OCR results
   - [ ] Payments
   - [ ] Student email provisioning
4. Nexa API key (optional — can be set in `.env` later)

### Step 2.3 — Scaffolded app includes

- `lib/nexa.ts` pre-configured for the chosen auth provider
- `app/api/nexa/[...nexaed]/route.ts` (one line)
- `app/dashboard/page.tsx` with a `<StudentRecordsGrid />` from `@nexa-ed/react`
- `.env.example` with all required vars and comments
- `README.md` with the two env vars to fill in

### Step 2.4 — Write docs page: "Quick Start (CLI)"

Immediately after Step 2.3.
Doc page: `docs/web/content/docs/getting-started/cli.mdx`

---

## Phase 3 — `docs/web/` Documentation Site ✅

> **Complete.** Fumadocs site bootstrapped at `docs/web/`. All content pages written.
> Run with `pnpm dev:docs` (port 3002). Deploy target: `docs.nexa-ed.com` via Vercel.
>
> **Goal:** `docs.nexa-ed.com` — auto-updated as each SDK feature ships.
> Every phase above ships its own doc page at the same time.

### Step 3.1 — Bootstrap docs site

```
docs/
  web/
    app/               ← Next.js App Router
    content/
      docs/
        getting-started/
          installation.mdx
          quickstart.mdx
          cli.mdx
        sdk/
          files.mdx
          payments.mdx
          documents.mdx
          webhooks.mdx
          services.mdx
        react/
          components.mdx
          hooks.mdx
        reference/
          types.mdx
          errors.mdx
    package.json       ← name: nexaed-docs (private, not published)
```

**Framework:** Fumadocs (Next.js based, best-in-class for SDK docs).

### Step 3.2 — Docs written alongside each feature (the rule)

> **No doc, no done.**
>
> Any time a new procedure, component, hook, or config option is added to any
> SDK package, its doc page is updated in the same commit. The only exception
> is `@nexa-ed/react` component stubs that aren't wired yet.

### Step 3.3 — Deploy

- Hosted on Vercel (separate project from `apps/web`)
- Domain: `docs.nexa-ed.com`
- Auto-deploy on push to `master` (only `docs/web` path filter)

---

## Phase 4 — Private Publishing Setup ✅

> **Complete.**
>
> **Goal:** The SDK packages are publishable to npm (restricted scope) and
> installable by invited school developers.

### Step 4.1 — GitHub Actions publish workflow

```yaml
# .github/workflows/publish-sdk.yml
# Triggers on tags: sdk-core-v*, sdk-next-v*, sdk-react-v*
# Runs: pnpm build → pnpm publish --access restricted
```

### Step 4.2 — Changesets for versioning

```
pnpm add -Dw @changesets/cli
pnpm changeset init
```

Each PR that changes an SDK package includes a changeset file.
Release: `pnpm changeset version` → `pnpm changeset publish`.

### Step 4.3 — Security checklist before first publish

- [x] `.npmignore` or `files` array only ships `dist/` + `CHANGELOG.md`
- [x] No `.env` files tracked
- [x] `SECURITY.md` at repo root with responsible disclosure policy
- [ ] GitHub secret scanning enabled on the repo (repo setting — enable in GitHub UI)
- [ ] Dependabot enabled for `sdk/` packages (repo setting — enable in GitHub UI)
- [x] No hardcoded URLs, secrets, or internal hostnames in built output
- [x] `publishConfig.access: "restricted"` in all four `package.json` files

---

## Phase 5 — Loretto Migration (validation gate) ✅

> **Goal:** Replace loretto's manual integration boilerplate with the SDK.
> This validates the SDK works end-to-end in a real production app.

**✅ Complete.**

### Changes in `apps/loretto`

| Current (manual) | Replaced by SDK |
|------------------|-----------------|
| `src/lib/nexaOrpc.ts` | `lib/nexa.ts` using `createNexa()` |
| `app/api/nexa/[...nexaed]/route.ts` | `createRouteHandler({ client: nexa })` |
| `app/api/nexa/progress/[fileId]/route.ts` | Handled by catch-all |
| `app/api/nexa/file-processing/forward/route.ts` | `onFileComplete` callback |
| Manual HMAC verification | `nexa.webhooks.verify()` in SDK |

---

## Commit Convention for SDK Work

All SDK commits are prefixed `sdk:` to make them easy to filter:

```
sdk(core): add payments.getRecent() procedure
sdk(next): fix SSE proxy headers for Safari
sdk(react): migrate StudentRecordsGrid component
sdk(docs): add webhooks reference page
sdk(cli): add NextAuth template option
```

---

## Quick Reference — What's In Each Package

### `@nexa-ed/sdk`
```ts
import { NexaClient } from "@nexa-ed/sdk";
const nexa = new NexaClient({ apiKey, webhookSecret });

nexa.files.submit({ fileUrl, userId, extractionType })
nexa.files.streamProgress(fileId, userId)        // AsyncGenerator<FileProgressEvent>

nexa.payments.initialize({ email, amount, ... })
nexa.payments.verify(reference)

nexa.documents.getUserDocuments(userId)
nexa.documents.getStudentRecords(userId, fileId, options)
nexa.documents.updateRecord(userId, recordId, data)
nexa.documents.deleteRecord(userId, recordId)
nexa.documents.refinePage(userId, fileId, chunkId, pageNumber)
nexa.documents.confirmSubjectGroups(userId, groups)
// + 10 more procedures

nexa.webhooks.verify(request)                    // → WebhookEvent
nexa.services.list()
```

### `@nexa-ed/next`
```ts
import { createNexa, createRouteHandler } from "@nexa-ed/next";
// Re-exports everything from @nexa-ed/sdk — install only this package
```

### `@nexa-ed/react` (coming in Phase 1)
```ts
import { StudentRecordsGrid, ProgressTracker, UploadZone } from "@nexa-ed/react";
import { useFileProgress } from "@nexa-ed/react";
```
