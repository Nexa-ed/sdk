# @nexa-ed/sdk

## 0.2.0-beta.5

### Minor Changes

- 1e9350a: Add `nexa.payments.createBankTransferIntent()` and `nexa.payments.confirmBankTransferSent()` for attributing Dedicated Virtual Account (DVA) bank transfers to a specific student/payer without a narration code.

  **`createBankTransferIntent(options)`**
  Declares an intent to pay by bank transfer before the payer sends it. Returns the tenant's dedicated bank-transfer account details plus an `expectedAmount` to show the payer — Nexa may nudge this by a few kobo so payers with an identical fee (e.g. flat tuition) can still be told apart on their first payment.

  **`confirmBankTransferSent(intentId)`**
  Payer-facing "I've sent it" — triggers an immediate check against Paystack instead of waiting for the next reconciliation pass, so the UI can show instant feedback.

  New types: `BankTransferIntentOptions`, `BankTransferIntentResult`, `ConfirmBankTransferSentResult`.

## 0.2.0-beta.4

### Patch Changes

- 9332750: all round update
- 01a862e: fix: correct package.json exports map — types condition ordering and dist path references
- fc4f679: added in workos and patched global.css bugs accordingly
- 890f1c9: patches to the packages for easier flow and maintainablility

## 0.2.0

### Minor Changes

#### Email Module (new)

- Added `nexa.email` module — full student email account provisioning via Nexa platform
- `nexa.email.create(options)` — provision a single student email account
- `nexa.email.bulkCreate(options)` — bulk-provision accounts via an async job
- `nexa.email.getJobStatus(jobId)` — poll the status of a bulk provisioning job
- `nexa.email.list(options)` — list provisioned student email accounts with pagination
- Supports three email tiers: `tier-1-nexa` (Nexa subdomain), `tier-2-stalwart` (own domain), `tier-3-google` (Google Workspace)
- Guard: descriptive `NexaError` thrown when `email.tier` / `email.domain` are missing from config

#### New Types

- `EmailCreateOptions` / `EmailCreateResult` — single account provisioning input/output
- `EmailBulkCreateOptions` / `EmailBulkCreateResult` — bulk provisioning input/output
- `EmailJobStatus` — async job polling response shape
- `StudentEmailAccount` — account object returned from list and create

#### Student Records

- Extended core types with student email account state fields

#### Client & Config

- `createNexa()` now accepts an optional `email: { tier, domain }` config block
- HTTP client updated to route `email.*` calls to the Nexa email API

### Patch Changes

- Updated dependencies: `@nexa-ed/sdk@0.2.0`

---

## 0.2.0-beta.2

### Patch Changes

- 8adccda: patch added readme docs

## 0.2.0-beta.1

### Minor Changes

- 6a67afc: from the sdk list

## 0.2.0-beta.0

### Minor Changes

- 3997bcf: initital package
