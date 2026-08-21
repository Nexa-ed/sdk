---
"@nexa-ed/sdk": minor
---

Add `nexa.payments.createBankTransferIntent()` and `nexa.payments.confirmBankTransferSent()` for attributing Dedicated Virtual Account (DVA) bank transfers to a specific student/payer without a narration code.

**`createBankTransferIntent(options)`**
Declares an intent to pay by bank transfer before the payer sends it. Returns the tenant's dedicated bank-transfer account details plus an `expectedAmount` to show the payer — Nexa may nudge this by a few kobo so payers with an identical fee (e.g. flat tuition) can still be told apart on their first payment.

**`confirmBankTransferSent(intentId)`**
Payer-facing "I've sent it" — triggers an immediate check against Paystack instead of waiting for the next reconciliation pass, so the UI can show instant feedback.

New types: `BankTransferIntentOptions`, `BankTransferIntentResult`, `ConfirmBankTransferSentResult`.
