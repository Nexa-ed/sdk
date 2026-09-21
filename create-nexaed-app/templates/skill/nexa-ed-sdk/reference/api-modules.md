# `NexaClient` API modules

Verified against `sdk/core/src/modules/*.ts`. `NexaClient` is the same class re-exported by `@nexa-ed/next` and `@nexa-ed/node` (`nexa.files`, `nexa.documents`, `nexa.payments`, `nexa.services`, `nexa.email`, `nexa.webhooks`).

## `nexa.files`

```ts
// Submit a file for OCR/extraction. Returns immediately (HTTP 202) with a jobId.
await nexa.files.submit({ fileUrl, userId, extractionType, processorType?, userEmail?, userName? });

// Async-generator SSE stream — prefer proxying through the framework adapter
// (Next.js catch-all `/progress/:fileId`, or `proxyProgressStream` in @nexa-ed/node)
// rather than calling this directly from a browser (EventSource can't send custom headers).
for await (const event of nexa.files.streamProgress(fileId, userId, signal?)) {
  if (event.type === "complete") { /* event.recordsExtracted etc. */ }
  if (event.type === "error") { /* ... */ }
}
```

## `nexa.documents`

All read/write methods take `userId` as the first argument (server resolves it via `getUser`, then you thread it through).

```ts
await nexa.documents.getUserDocuments(userId);                     // → { documents }
await nexa.documents.getFileDetails(userId, fileId);
await nexa.documents.getFileStatistics(userId, fileId);
await nexa.documents.getStudentRecords(userId, fileId, {           // paginated + filterable
  page: 1, limit: 50, filters: { pageStart: 1, pageEnd: 5 },
});
await nexa.documents.getPageRecords(/* userId, fileId, page, ... */);
await nexa.documents.updateRecord(/* userId, recordId, patch */);
await nexa.documents.createRecords(/* userId, fileId, rows */);
await nexa.documents.deleteRecord(/* userId, recordId */);
await nexa.documents.getLatestJob(userId, fileId);                  // → AnalysisJob | null
await nexa.documents.getJob(userId, jobId);
await nexa.documents.getJobResult(/* userId, jobId */);
await nexa.documents.resetJob(userId, fileId);                      // → { success }
await nexa.documents.confirmSubjectGroups(/* userId, fileId, groups */);
await nexa.documents.refinePage(/* userId, fileId, page */);        // LLM refinement
await nexa.documents.getRetryStatistics(userId);
await nexa.documents.getChunksWithPages(/* userId, fileId */);
```

For the exact parameter object shape of the methods left abbreviated above, read the JSDoc directly above each method in `node_modules/@nexa-ed/sdk/dist/index.d.ts` (or `sdk/core/src/modules/documents.ts` in this monorepo) — they take options objects whose fields vary per method and are fully typed there.

## `nexa.payments`

```ts
// Amounts are always in the smallest currency unit (kobo for NGN).
const { paymentUrl, reference } = await nexa.payments.initialize({
  email: "student@school.edu",
  amount: 5_000_00, // ₦5,000
  metadata: { source: "enrollment", studentId: "stu_123" },
  callbackUrl: "https://myschool.com/payment/callback",
});
// redirect the user to paymentUrl

const result = await nexa.payments.verify(reference);
if (result.transaction?.status === "success") { /* confirmed */ }

// Pull a transaction into your own DB even before the webhook arrives
await nexa.payments.sync(nexaReference, tenantId);

const config = await nexa.payments.getConfig();       // { mode: "test" | "live", ... }
await nexa.payments.getStatus(reference);
await nexa.payments.getTransactions({ /* filters */ });
await nexa.payments.getStats({ from?, to? });

// Direct bank transfer (DVA) flow — newer, may not be wired into every tenant app yet
await nexa.payments.createBankTransferIntent({ /* ... */ });
await nexa.payments.confirmBankTransferSent(intentId);
```

## `nexa.services`

```ts
await nexa.services.list();               // → GetServicesResponse — full catalog + enabled state
await nexa.services.get(serviceId);       // → TenantService
await nexa.services.getUsage(serviceId);  // → usage stats for a gated service
```

## `nexa.email`

Requires `email: { tier, domain }` in `createNexa()` — throws `EMAIL_CONFIG_MISSING` (400) otherwise. Same methods work identically across tier-1 (Nexa-hosted), tier-2 (Stalwart), tier-3 (Google Workspace).

```ts
const account = await nexa.email.create({
  studentId: "stu_001", firstName: "John", lastName: "Doe",
  gradeLevel: "SS2", recoveryEmail: "parent@gmail.com",
});
// account.email, account.temporaryPassword — send the password to the student out-of-band

// Up to 500 students per call (auto-batched in groups of 100). Async — returns a jobId.
const { jobId } = await nexa.email.bulkCreate({
  students: [
    { studentId: "stu_001", firstName: "John", lastName: "Doe" },
    { studentId: "stu_002", firstName: "Jane", lastName: "Smith" },
  ],
});
const status = await nexa.email.getJobStatus(jobId); // poll for status.successCount / totalStudents

await nexa.email.suspend(email);
await nexa.email.restore(email);
await nexa.email.resetPassword(email);   // → { email, temporaryPassword }
await nexa.email.list({ /* filters */ });
await nexa.email.getStats();
```

## `nexa.webhooks`

See `reference/webhooks-errors.md`.

## Errors

Every module throws `NexaError` on non-2xx responses. See `reference/webhooks-errors.md` for the full code table.
