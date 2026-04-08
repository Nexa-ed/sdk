# @nexa-ed/convex

## 0.2.0-beta.4

### Patch Changes

- 9332750: all round update
- 01a862e: fix: correct package.json exports map — types condition ordering and dist path references
- 890f1c9: patches to the packages for easier flow and maintainablility
- Updated dependencies [9332750]
- Updated dependencies [01a862e]
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
