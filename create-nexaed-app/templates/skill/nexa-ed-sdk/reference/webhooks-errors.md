# Webhooks & errors

Verified against `sdk/core/src/modules/webhooks.ts`, `sdk/core/src/types/index.ts`, and `sdk/docs/content/docs/reference/errors.mdx`.

## How webhook verification works

Nexa signs every webhook with HMAC-SHA256 over `body + timestamp`, using your `NEXA_WEBHOOK_SECRET`:

- `x-nexa-signature` header — hex-encoded HMAC-SHA256
- `x-nexa-timestamp` header — Unix timestamp (seconds) when signed
- Events older than 5 minutes are rejected by default (replay protection) — override with `{ maxAgeSeconds }`

On Next.js, `createRouteHandler` verifies automatically for `file.completed` (→ `onFileComplete`) and `payment.completed` (→ `onPaymentComplete`) — you never touch signature verification for those two events.

## Manual verification (any other event, or outside the catch-all route)

```ts
import { nexa } from "@/lib/nexa"; // or a bare NexaClient

export async function POST(request: Request) {
  const event = await nexa.webhooks.verify(request); // throws NexaError if invalid/expired

  // Discriminate on `event.event` — NOT `event.type`. (Easy to mix up: the SDK's
  // OTHER event stream, FileProgressEvent from streamProgress()/useFileProgress,
  // really does use `.type`. WebhookEvent does not.)
  switch (event.event) {
    case "file.completed":
      // { event, fileId, userId, tenantId, timestamp }
      break;
    case "payment.completed":
      // { event, reference, tenantId, status, amount, customerEmail }
      break;
    case "email.created":
      // { event, tenantId, studentId, email, firstName, lastName, gradeLevel?, provider }
      break;
    case "email.status_changed":
      // { event, tenantId, email, studentId, previousStatus, status, changedAt }
      break;
    case "email.bulk_completed":
      // { event, tenantId, jobId, status, totalStudents, successCount, failedCount }
      // no automatic callback exists for this on @nexa-ed/next — always handled here
      break;
  }

  return Response.json({ received: true });
}
```

In `@nexa-ed/node` (non-Next.js), use `verifyWebhookPayload(rawBody, signature, timestamp, secret)` instead — same discriminant field, same event union.

Webhook handlers should **throw** on failure (don't swallow errors) — a non-2xx response makes Nexa retry (up to 5 times, exponential backoff). Silently succeeding on a failed DB write means the event is lost forever.

## `NexaError`

```ts
import { NexaError, isNexaError } from "@nexa-ed/next"; // or @nexa-ed/node / @nexa-ed/sdk

try {
  await nexa.files.submit({ ... });
} catch (err) {
  if (isNexaError(err)) {
    console.error(err.code, err.message, err.status);
  }
}
```

`code` (string), `message` (string), `status` (HTTP status from the Nexa API). Branch on `.code`, never on `.message` — messages aren't a stable contract.

## Error codes

| Code | Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing/invalid API key |
| `FORBIDDEN` | 403 | API key lacks permission for this operation |
| `WEBHOOK_SIGNATURE_INVALID` | 400 | HMAC mismatch — tamper or replay |
| `FILE_NOT_FOUND` | 404 | No file with this `fileId` for the tenant |
| `FILE_PROCESSING_FAILED` | 422 | Pipeline failed — check `error` field in the webhook |
| `FILE_QUOTA_EXCEEDED` | 429 | Tenant page quota exhausted |
| `INVALID_FILE_TYPE` | 400 | Only PDF supported |
| `PAYMENT_NOT_FOUND` | 404 | No payment with this `reference` |
| `PAYMENT_VERIFICATION_FAILED` | 422 | Paystack couldn't verify the reference |
| `PAYMENT_CONFIG_MISSING` | 500 | Tenant payment config not set up |
| `EMAIL_CONFIG_MISSING` | 400 | `email.tier`/`email.domain` missing from `createNexa()` |
| `EMAIL_DOMAIN_NOT_VERIFIED` | 403 | Domain DNS setup incomplete |
| `EMAIL_ACCOUNT_EXISTS` | 409 | Account with this email already exists |
| `EMAIL_PROVIDER_ERROR` | 502 | Upstream provider (Stalwart/Google Workspace) error |
| `EMAIL_JOB_NOT_FOUND` | 404 | No bulk job with this `jobId` |
| `VALIDATION_ERROR` | 400 | Request body failed validation — see `message` |
| `RATE_LIMITED` | 429 | See below |
| `UPSTREAM_ERROR` | 502 | Nexa's own upstream failed |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

## Rate limits

`RATE_LIMITED` (429) responses include a `Retry-After` header (seconds). The SDK auto-retries once using that value; a second failure throws.

| Endpoint | Limit |
|---|---|
| `POST /api/file-processing/extract` | 20/min per tenant |
| `POST /api/payments/initialize` | 10/min per tenant |
| `POST /api/student-emails/bulk` | 5/min per tenant |
| `POST /api/rpc/[...orpc]` | 120/min per user |
| Everything else | 60/min per tenant |

```ts
try {
  await nexa.files.submit({ fileUrl, fileId, userId });
} catch (err) {
  if (isNexaError(err) && err.code === "RATE_LIMITED") {
    console.warn(`Rate limited. Retry after ${err.headers?.["retry-after"]}s`);
  }
}
```
