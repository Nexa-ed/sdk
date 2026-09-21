# Node / non-Next.js frameworks — `@nexa-ed/node`, `@nexa-ed/convex`

Verified against `sdk/node/src/index.ts` and `sdk/convex/src/index.ts`.

## Install

```bash
pnpm add @nexa-ed/node
```

Node 18+ (uses the built-in Web Crypto API). Re-exports the full core SDK — don't also install `@nexa-ed/sdk`.

```bash
NEXA_API_KEY=nxa_live_...
NEXA_WEBHOOK_SECRET=nxa_live_...   # same value as NEXA_API_KEY — Nexa signs webhooks with your API key
```

## Direct API calls — `NexaClient`

Same class used under the hood by every adapter. Use it in any server context (Express handler, Fastify route, Hono handler, a plain script):

```ts
import { NexaClient } from "@nexa-ed/node";

const nexa = new NexaClient({
  apiKey: process.env.NEXA_API_KEY!,
  webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
});

const result = await nexa.files.submit({
  fileUrl: "https://storage.example.com/term2.pdf",
  fileId: "file_abc123",
  fileName: "term2-results.pdf",
  userId: "user_abc",
});

const payment = await nexa.payments.verify("nxa_ref_xyz");
```

Full method list for every module: `reference/api-modules.md`.

## Webhook verification without a framework adapter

```ts
import { verifyWebhookPayload } from "@nexa-ed/node";

// rawBody: the full request body as a string, read BEFORE any JSON parsing
// signature: the `x-nexa-signature` header
// timestamp: the `x-nexa-timestamp` header
const event = await verifyWebhookPayload(
  rawBody,
  signature,
  timestamp,
  process.env.NEXA_WEBHOOK_SECRET!,
);

// discriminate on `event.event`, NOT `event.type`
if (event.event === "file.completed") {
  console.log("File processed:", event.fileId);
}
```

Throws `NexaError` (401) on invalid/missing signature, or (400) if the event is older than 5 minutes (replay protection).

## SSE progress proxy

```ts
import http from "node:http";
import { Readable } from "node:stream";
import { proxyProgressStream } from "@nexa-ed/node";

const server = http.createServer(async (req, res) => {
  const fileId = req.url?.split("/").pop() ?? "";
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
  });
  const stream = await proxyProgressStream(fileId, { apiKey: process.env.NEXA_API_KEY! });
  Readable.fromWeb(stream).pipe(res);
});
```

## Express / Fastify / Hono adapters

Pre-built adapters exist under `@nexa-ed/node`'s `adapters/` — check `node_modules/@nexa-ed/node/dist/index.d.ts` for the current exported adapter functions before hand-rolling middleware; the shape may differ slightly between framework adapters (each wraps `verifyWebhookPayload` for that framework's request/response types). If no adapter export matches your framework, fall back to the raw `verifyWebhookPayload` pattern above — it's framework-agnostic.

## Vue / Svelte / other frontend frameworks

There's no dedicated `@nexa-ed/vue` or `@nexa-ed/svelte` package. Put `@nexa-ed/node` on your server (API routes / server endpoints) using the patterns above, and call your own backend from the frontend — don't call Nexa directly from client code (the API key must stay server-side).

## Convex — `@nexa-ed/convex`

```bash
pnpm add @nexa-ed/convex
```

Peer dep: `convex >=1.9.0`.

```ts
// convex/schema.ts
import { defineSchema } from "convex/server";
import { nexaPaymentsSchema, nexaFilesSchema, nexaStudentEmailsSchema } from "@nexa-ed/convex/schema";

export default defineSchema({
  ...nexaPaymentsSchema,
  ...nexaFilesSchema,
  ...nexaStudentEmailsSchema, // optional — only if you provision student email accounts
});
```

```ts
// convex/nexa.ts — expose the pre-built mutations/queries
export { upsertPaymentFromNexa, upsertFileResultFromNexa, upsertStudentEmailFromNexa } from "@nexa-ed/convex/mutations";
export { getPaymentByReference, getPaymentsByEmail, getFileResult, getFileResultsByUser, getStudentEmailByEmail, listStudentEmailsByTenant, listStudentEmailsByStatus } from "@nexa-ed/convex/queries";
```

**Required before wiring handlers:** run `npx convex dev` (or `npx convex codegen`) once after creating `convex/nexa.ts`. Until codegen regenerates `convex/_generated/api.ts`, the app's `api` object is empty (`api: {}`) and `api.nexa.*` doesn't exist — the handler factories throw with the fix steps if created without it. Never import `api` from the SDK's own `_generated` folder; always point at the app's `convex/_generated/api` (check the `@/` path alias resolves to the app root so `@/convex/_generated/api` is the app's tree).

```ts
// lib/nexa.ts — wire webhook callbacks straight into Convex mutations
import { createPaymentCompleteHandler, createFileCompleteHandler, createStudentEmailHandler } from "@nexa-ed/convex/handlers";
import { createNexa } from "@nexa-ed/next"; // or @nexa-ed/node if not on Next.js
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const nexa = createNexa({
  apiKey: process.env.NEXA_API_KEY!,
  webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
  getUser: async () => { /* ... */ },
  onPaymentComplete: createPaymentCompleteHandler(convex, api),
  onFileComplete: createFileCompleteHandler(convex, api),
});
```

`createStudentEmailHandler` isn't wired automatically by `createNexa` (no matching config callback exists yet — see `SKILL.md`'s "Known doc/source gaps"); call it manually from a route that verifies email webhook events with `nexa.webhooks.verify()`.
