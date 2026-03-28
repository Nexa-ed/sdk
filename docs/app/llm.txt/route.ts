import { NextResponse } from "next/server";

const CONTENT = `# Nexa-Ed Developer Documentation

> Official documentation for the Nexa-Ed SDK, REST API, and school portal development. Nexa-Ed is a multi-tenant SaaS education platform — this site covers everything needed to integrate, customise, or build on top of it.

Platform API reference: https://nexa-ed.com/llm.txt

---

## Getting Started

/docs/getting-started/installation  — Install @nexa-ed/sdk via npm, pnpm, or yarn. Prerequisites and version requirements.
/docs/getting-started/quickstart    — Initialise the SDK, make your first API call (document extract + payment initialise) in under 5 minutes.
/docs/getting-started/cli           — Scaffold a new school portal from scratch with: npx create-nexaed-app my-portal

---

## SDK Reference  (@nexa-ed/sdk)

/docs/sdk/documents  — NexaSDK.documents.*: extract(), getStatus(), getProgress(), listHistory(). Async extraction lifecycle, jobId polling, SSE streams.
/docs/sdk/files      — NexaSDK.files.*: getUploadToken(), uploadAndProcess(). Direct-to-storage uploads via UploadThing, combined upload+extract helper.
/docs/sdk/payments   — NexaSDK.payments.*: initialize(), verify(), listTransactions(), getStats(). Paystack payment flow, receipt helpers.
/docs/sdk/services   — NexaSDK.services.*: getCatalog(), getEnabled(), enable(), disable(). Service catalog, plan gating, toggle infrastructure services.
/docs/sdk/webhooks   — NexaSDK.webhooks.*: verify(), constructEvent(). HMAC-SHA512 signature verification, event types, handler patterns.

---

## REST API Reference

/docs/rest-api/            — Authentication (Bearer API key), base URL, error format, rate limiting overview.
/docs/rest-api/file-processing — POST /api/file-processing/extract and related endpoints. Request shape, response shape, status codes, SSE progress events.
/docs/rest-api/payments        — POST /api/payments/initialize through webhook verification. Full Paystack integration guide.
/docs/rest-api/documents       — Document management, job history, structured output format (student name, subject scores, grades as JSON).

---

## React Integration  (@nexa-ed/react)

/docs/react/components  — Pre-built UI components:
                          <PaymentButton />      — Triggers Paystack checkout, handles redirect.
                          <DocumentUploader />   — Drag-and-drop file upload with real-time progress bar.
                          <ReceiptCard />        — Displays a formatted payment receipt.
                          <ResultsTable />       — Renders extracted student results in a responsive table.
                          <ServiceStatusBadge /> — Shows enabled/disabled state for a platform service.

/docs/react/hooks       — React hooks:
                          useDocumentStatus(jobId)    — Subscribes to SSE progress stream.
                          usePaymentStatus(reference) — Polls payment verification.
                          useServiceCatalog()         — Fetches available services + plan gating.
                          useBranding()               — Reads school branding from context (used inside school portals).

---

## Framework Guides

/docs/node/hono      — Nexa-Ed SDK in a Hono edge worker: API key middleware, route handlers, webhook receiver.
/docs/node/express   — Express.js integration: middleware setup, route examples, error handling.
/docs/node/fastify   — Fastify plugin pattern for Nexa-Ed SDK.
/docs/frameworks/vue    — Vue 3 composables wrapping the SDK. useDocumentExtract, usePayment examples.
/docs/frameworks/svelte — Svelte stores and actions for SDK integration.

---

## Convex Integration  (@nexa-ed/convex)

The @nexa-ed/convex package ships schema fragments and mutation/query factory functions for schools that run their own Convex project (the default for school portals scaffolded with create-nexaed-app).

Includes: student record schemas, assignment schemas, attendance schemas, email account schemas.
Usage: merge fragments into your Convex schema.ts, then use the provided query/mutation factories.

---

## Platform Concepts

tenantId       {slug}_{orgId[:5]} — uniquely identifies a school on the Nexa-Ed platform.
Subdomain      {schoolname}.nexa-ed.com — each school portal resolves to this via wildcard DNS.
Plans          free / basic / standard / premium / enterprise — gate service access and rate limits.
API key        Bearer token. Get from https://nexa-ed.com/dashboard/settings. Rotate at any time.
Async jobs     Document extraction is async. POST /extract → receive jobId → poll SSE progress.
Branding API   GET /api/branding/{subdomain} — public endpoint, no auth, CDN-cached 5 min.

---

## Reference

/docs/reference/types   — Full TypeScript type definitions: NexaConfig, ExtractionJob, ExtractionResult, PaymentSession, ServiceCatalogEntry, BrandingResponse, WebhookEvent, and more.
/docs/reference/errors  — Error codes (INVALID_API_KEY, TENANT_NOT_FOUND, PLAN_REQUIRED, RATE_LIMIT_EXCEEDED, EXTRACTION_FAILED, etc.), HTTP status mapping, retry guidance.

---

## Support

Platform API reference: https://nexa-ed.com/llm.txt
GitHub:                 https://github.com/nexa-ed
Issues:                 https://github.com/nexa-ed/sdk/issues
Email:                  support@nexa-ed.com
`;

export async function GET() {
  return new NextResponse(CONTENT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=3600",
    },
  });
}
