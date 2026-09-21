# Next.js setup — `@nexa-ed/next`

Verified against `sdk/next/src/{create-nexa.ts,route-handler.ts,types.ts}`.

## Install

```bash
pnpm add @nexa-ed/next @nexa-ed/react
```

Peer deps: Next.js 15+, React 19+. `@nexa-ed/next` re-exports the full core SDK — don't also install `@nexa-ed/sdk`.

## 1. `lib/nexa.ts` — the one config file

```ts
import { createNexa } from "@nexa-ed/next";
import { auth } from "@clerk/nextjs/server"; // or WorkOS/NextAuth/your own session

export const nexa = createNexa({
  apiKey: process.env.NEXA_API_KEY!,
  webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,

  // Required. Resolve the current user for every request the route handler proxies.
  getUser: async (request) => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    return { userId };
  },

  // Required only if you call nexa.email.* — provisioning tier + domain.
  email: { tier: "tier-3-google", domain: "yourschool.edu" },

  // Optional — called after the SDK verifies a file.completed webhook.
  onFileComplete: async ({ fileId, userId, tenantId }) => {
    await syncRecordsToYourDb(fileId, userId);
  },

  // Optional — called after the SDK verifies a payment.completed webhook.
  onPaymentComplete: async ({ reference, amount, customerEmail, tenantId }) => {
    await yourDb.payments.upsert({ reference, amount, customerEmail });
  },
});
```

`createNexa` throws synchronously if `apiKey`, `webhookSecret`, or `getUser` is missing — this is intentional fail-fast, don't wrap it in try/catch to suppress it.

There is **no** `onEmailBulkCompleted` (or any email-event callback) on this config — see the "Known doc/source gaps" section in `SKILL.md`. Handle email webhooks manually (`reference/webhooks-errors.md`).

## 2. Catch-all route — the entire server surface

```ts
// app/api/nexa/[...nexaed]/route.ts
import { createRouteHandler } from "@nexa-ed/next";
import { nexa } from "@/lib/nexa";

export const { GET, POST } = createRouteHandler({ client: nexa });
```

What it covers (don't hand-roll separate routes for these):

| Method | Path | Purpose |
|---|---|---|
| `GET` | `/api/nexa/progress/:fileId` | SSE proxy for real-time OCR/extraction progress |
| `GET/POST` | `/api/nexa/rpc/*` | Typed data calls (student records, jobs) |
| `POST` | `/api/nexa/webhook` | Verifies + dispatches `file.completed` → `onFileComplete` |
| `POST` | `/api/nexa/prepare` | Issues a short-lived upload token (key never reaches the client) |
| `GET/POST` | `/api/nexa/payments/*` | Payment init/status/config |
| `POST` | `/api/nexa/payments/forward` | Verifies + dispatches `payment.completed` → `onPaymentComplete` |

Register the two webhook URLs (`/api/nexa/webhook`, `/api/nexa/payments/forward`) in the Nexa dashboard against your deployed domain.

## 3. `NexaProvider` — required for hooks/components

```tsx
// app/layout.tsx
import { NexaProvider } from "@nexa-ed/react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <NexaProvider>{children}</NexaProvider>
      </body>
    </html>
  );
}
```

If the catch-all route isn't mounted at `/api/nexa`, pass `basePath` to `NexaProvider` to match.

## After this

Use `reference/react-ui.md` for the hooks/components available inside `NexaProvider`, and `reference/api-modules.md` if you need to call `nexa.files.*` / `nexa.payments.*` / etc. directly from server code (e.g. inside `onFileComplete`, a Server Action, or an API route outside the catch-all).
