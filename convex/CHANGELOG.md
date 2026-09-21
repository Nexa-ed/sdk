# @nexa-ed/convex

## 0.2.0-beta.6

### Patch Changes

- fix: `createPaymentCompleteHandler`/`createFileCompleteHandler`/`createStudentEmailHandler` no longer require an impossible strict structural `api` type. Convex codegen references are branded string types, not `(args) => Promise` callables, so the old `Nexa*Api` interfaces could never match a real generated `api` tree — every consumer was forced into `api as any`. The `api` parameter is now the exported `NexaConvexApi` type (accepts codegen'd trees, `anyApi`, and pre-codegen empty objects), and each factory validates `api.nexa.<mutation>` at creation time, throwing an error with the exact mount + `npx convex codegen` fix steps when it's missing.

## 0.2.0-beta.5

### Patch Changes

- fix: `createStudentEmailHandler`/`createPaymentCompleteHandler`/`createFileCompleteHandler` no longer import the nominal `ConvexHttpClient` class type from `convex/browser`. They now accept a minimal structural `{ mutation }` shape instead, so consuming apps are no longer forced onto whatever `convex` version this package happened to be built against — fixes a type error when a tenant app's `convex` version diverges from this package's.
- fix: `createStudentEmailHandler`'s returned handler now takes the actual `email.created`/`email.status_changed` webhook event (`WebhookEmailCreatedEvent | WebhookEmailStatusChangedEvent`) instead of a full `StudentEmailAccount`. The old parameter type didn't match what any caller actually has on hand in a webhook route — passing the verified webhook event failed to type-check.

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

#### Schema Fragments

- `nexaPaymentsSchema` — Convex table definition for payment transactions; spread into your `defineSchema()` call
- `nexaFilesSchema` — Convex table definition for uploaded files and processing state
- `nexaStudentEmailSchema` — Convex table definition for provisioned student email accounts

#### Mutations

- `createPaymentTransaction` — record an incoming payment from Nexa
- `updatePaymentStatus` — update transaction status after webhook verification
- `upsertStudentEmailAccount` — create or update a student email account record
- `bulkUpsertStudentEmailAccounts` — batch upsert email accounts from a provisioning job

#### Queries

- `getPaymentByReference` — look up a payment transaction by Paystack reference
- `listPaymentsByTenant` — paginated list of payments for a tenant
- `getStudentEmailAccount` — fetch a single student email account
- `listStudentEmailAccounts` — paginated list of student email accounts

#### Handlers

- `makePaymentWebhookHandler(options)` — factory for a Convex HTTP action that verifies Paystack webhook signatures and stores transactions
- `makeEmailProvisioningHandler(options)` — factory for a Convex HTTP action that receives email provisioning callbacks from Nexa

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
