# @nexa-ed/node

## 0.2.0-beta.3

### Minor Changes

- e8c8739: ---

### Patch Changes

- 10bb2ff: adjsutments to teh name?
- Updated dependencies [e8c8739]
- Updated dependencies [10bb2ff]
  - @nexa-ed/sdk@0.2.0-beta.3

## 0.2.0

### Minor Changes

#### Framework Adapters

- `createExpressAdapter(nexaInstance)` — mount Nexa handlers as Express middleware
- `createFastifyAdapter(nexaInstance)` — mount Nexa handlers as a Fastify plugin
- `createHonoAdapter(nexaInstance)` — mount Nexa handlers as a Hono app route group

#### Webhook Verification

- `verifyPaystackWebhook(payload, signature, secret)` — verify Paystack HMAC-SHA512 webhook signatures in any Node.js environment

#### Progress Streaming

- `createProgressStream(jobId, options)` — create an SSE-compatible readable stream for file processing progress; works with any HTTP framework

### Patch Changes

- Updated dependencies: `@nexa-ed/sdk@0.2.0`

---

## 0.2.0-beta.2

### Patch Changes

- 8adccda: patch added readme docs
- Updated dependencies [8adccda]
  - @nexa-ed/sdk@0.2.0-beta.2

## 0.2.0-beta.1

### Minor Changes

- 6a67afc: from the sdk list

### Patch Changes

- Updated dependencies [6a67afc]
  - @nexa-ed/sdk@0.2.0-beta.1

## 0.2.0-beta.0

### Minor Changes

- 3997bcf: initital package

### Patch Changes

- Updated dependencies [3997bcf]
  - @nexa-ed/sdk@0.2.0-beta.0
