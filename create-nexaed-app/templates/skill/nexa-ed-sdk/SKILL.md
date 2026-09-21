---
name: nexa-ed-sdk
description: Integrate @nexa-ed/sdk (Next.js, Node, React, Convex packages) into an app — payments, file/OCR processing, webhooks, student email provisioning against the Nexa-Ed platform API.
metadata:
  author: Nexa-Ed
  version: 1.0.0
---

# Nexa-Ed SDK integration

Use this skill whenever the project depends on `@nexa-ed/sdk`, `@nexa-ed/next`, `@nexa-ed/node`, `@nexa-ed/react`, or `@nexa-ed/convex`, or when the user asks to integrate Nexa-Ed (payments, document/OCR extraction, webhooks, or student email provisioning) into an app.

**Source of truth order**: this file and `reference/*.md` are verified against SDK source as of `@nexa-ed/sdk@0.2.x`/`@nexa-ed/next@0.3.x`. If something here conflicts with what's actually installed, trust the installed code over this file:

1. `node_modules/@nexa-ed/*/dist/index.d.ts` — actual exported types/functions, always current
2. https://docs.nexa-ed.com/llm.txt — hosted docs index (can lag the source; a few examples there describe callbacks not yet wired into every adapter — see "Known doc/source gaps" below)
3. This skill

## Decision tree — which package(s)

| Stack | Install | Golden path doc |
|---|---|---|
| Next.js 15 App Router | `@nexa-ed/next` + `@nexa-ed/react` | `reference/nextjs-setup.md` |
| Express / Fastify / Hono / raw Node | `@nexa-ed/node` | `reference/node-other-frameworks.md` |
| React (Vite/Remix), server elsewhere | `@nexa-ed/react` (+ `@nexa-ed/node` on the server) | `reference/react-ui.md` |
| Vue / Svelte / other frontend | `@nexa-ed/node` on the server, hand-rolled UI | `reference/node-other-frameworks.md` |
| Convex backend | `@nexa-ed/convex` (schema fragments + factories) | `reference/node-other-frameworks.md` (Convex section) |
| No JS/TS runtime | No package — call the REST API directly, see https://docs.nexa-ed.com/docs/rest-api | — |

`@nexa-ed/next` and `@nexa-ed/node` both re-export the full core SDK (`NexaClient`, `NexaError`, all types) — never add `@nexa-ed/sdk` as a direct dependency alongside them, it's redundant.

## Required environment variables (every path)

```bash
NEXA_API_KEY=nxa_live_...       # required — Nexa dashboard → API key
NEXA_WEBHOOK_SECRET=nxa_live_... # required if you handle webhooks — SAME value as NEXA_API_KEY (Nexa signs webhooks with the API key)
NEXA_URL=https://nexa-ed.com    # optional — only override for local Nexa platform dev
```

Never expose `NEXA_API_KEY` to client-side code. Every SDK package proxies calls through the app's own server; the key must stay server-only.

## Golden path (Next.js — do this unless told otherwise)

1. `pnpm add @nexa-ed/next @nexa-ed/react` (Next.js 15+, React 19+ required)
2. One `lib/nexa.ts` calling `createNexa({...})` — the single place API key, webhook secret, `getUser`, and webhook callbacks are configured
3. One catch-all route `app/api/nexa/[...nexaed]/route.ts` exporting `{ GET, POST } = createRouteHandler({ client: nexa })` — this is the entire server surface
4. Wrap the root layout in `<NexaProvider>` from `@nexa-ed/react`
5. Use the hooks/components from `reference/react-ui.md` in pages

Full code and the exact `createNexa` config shape: `reference/nextjs-setup.md`.

## Reference files

- `reference/nextjs-setup.md` — `createNexa`/`createRouteHandler`/`NexaProvider`, the exact `NexaNextConfig` fields, what the catch-all route covers
- `reference/node-other-frameworks.md` — direct `NexaClient` usage, `verifyWebhookPayload`, `proxyProgressStream`, Express/Fastify/Hono adapters, `@nexa-ed/convex` schema fragments
- `reference/react-ui.md` — verified component and hook export list from `@nexa-ed/react` source (do not use the component names from the older marketing docs — see gaps below)
- `reference/api-modules.md` — every `NexaClient` module (`files`, `documents`, `payments`, `services`, `email`) with real method signatures
- `reference/webhooks-errors.md` — webhook signing/verification, the `WebhookEvent` union (discriminated on `event`, not `type`), `NexaError` codes, rate limits

## Key principles

- **Minimal surface**: one `lib/nexa.ts` + one catch-all route for Next.js. Don't hand-roll additional routes for things the catch-all already covers (upload, progress SSE, webhook receive, payments, rpc).
- **Webhooks are server-verified, not client-trusted**: never process a "payment succeeded" or "file completed" signal from client state — only from `onFileComplete`/`onPaymentComplete` callbacks or a manually-verified `nexa.webhooks.verify(request)`.
- **Async by default**: file processing and bulk email provisioning return a job/id immediately; poll or subscribe (SSE via `useFileProgress` / `proxyProgressStream`), don't assume synchronous completion.
- **Amounts are in the smallest currency unit** (kobo for NGN) everywhere in payment types — divide by 100 for display.
- **Errors**: catch `NexaError`, branch on `.code` (see `reference/webhooks-errors.md`), not on `.message` string matching.

## Facts worth remembering (previously doc/source gaps, fixed upstream 2026-09-07)

These used to be places where the hosted docs disagreed with the SDK source; the docs pages have since been corrected, but the underlying facts are easy to get wrong again from memory or from a stale cache, so they're repeated here:

- `createNexa()` (`@nexa-ed/next`) only accepts `onFileComplete` and `onPaymentComplete`. There is no `onEmailBulkCompleted` or any other email-event callback. For `email.bulk_completed`, `email.created`, and `email.status_changed`, verify manually with `nexa.webhooks.verify(request)` in your own route — see `reference/webhooks-errors.md`.
- Every `WebhookEvent` variant discriminates on `event.event`, not `event.type`.
- The catch-all route handler has **no** `/api/nexa/email-*` path — don't register `/api/nexa/email-provisioning/forward` (or similar) in the Nexa dashboard, it will 404. Write a custom route for email events instead.
- `FileProgressEvent` (from `nexa.files.streamProgress()` / `useFileProgress`) uses `.progressPct` and `.recordsExtracted`, not `.progress` or `.records`.
- `llm.txt`'s React component summary previously listed invented component names (`PaymentButton`, `DocumentUploader`, etc.); the dedicated `/docs/react/components` page was always accurate. Use the verified names in `reference/react-ui.md` either way.
- **Convex apps must mount `convex/nexa.ts` before wiring handlers.** `@nexa-ed/convex` ships pre-built mutations, but Convex codegen only sees functions reachable from the *app's* `convex/` dir. Without a `convex/nexa.ts` re-export (then `npx convex dev` / `npx convex codegen` to regenerate), the app's generated `api` is `{}` and `api.nexa.*` doesn't exist — `createFileCompleteHandler`/`createPaymentCompleteHandler` throw at creation with the fix steps. See `reference/node-other-frameworks.md` (Convex section) for the exact file contents.
