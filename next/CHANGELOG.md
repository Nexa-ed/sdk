# @nexa-ed/next

## 0.2.0-beta.4

### Patch Changes

- 9332750: all round update
- 01a862e: fix: correct package.json exports map — types condition ordering and dist path references
- fc4f679: added in workos and patched global.css bugs accordingly
- 890f1c9: patches to the packages for easier flow and maintainablility
- Updated dependencies [9332750]
- Updated dependencies [01a862e]
- Updated dependencies [fc4f679]
- Updated dependencies [890f1c9]
  - @nexa-ed/sdk@0.2.0-beta.4

## 0.2.0

### Minor Changes

#### `createNexa()` Factory

- New `createNexa(config)` factory — creates a configured Nexa instance with all route handlers pre-bound
- Returns a `NexaInstance` with `.handlers` ready to mount in your Next.js `app/api/` directory

#### Route Handlers

- `upload` — handles UploadThing file upload requests from the Nexa UI
- `prepareUpload` — prepares signed upload metadata before the client begins uploading
- `progress` — Server-Sent Events (SSE) endpoint for real-time file processing progress
- `webhook` — verifies and processes inbound Paystack payment webhooks
- `paymentsApi` — proxies payment initialization / verification calls to Nexa platform
- `paymentsForward` — forwards payment events to your Convex backend via `nexaPaymentsSchema`
- `rpc` — oRPC handler for typed data queries (documents, records, analysis jobs)

#### Route Handler Mounting

- `createRouteHandler(nexaInstance, options)` — mounts all handlers at a single `[...nexa]` catch-all route with one line

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
