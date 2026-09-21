# React UI — `@nexa-ed/react`

Verified export list from `sdk/react/src/index.ts` (current as of this skill's last check). The dedicated docs page (`/docs/react/components`) is accurate; **`llm.txt`'s "React Integration" summary was stale** — it named `PaymentButton`, `DocumentUploader`, `ReceiptCard`, `ResultsTable`, `ServiceStatusBadge`, none of which exist in the package. Use the names below either way.

## Setup

```tsx
import { NexaProvider } from "@nexa-ed/react";

<NexaProvider basePath="/api/nexa"> {/* basePath defaults to "/api/nexa" — only pass it if your catch-all route is mounted elsewhere */}
  {children}
</NexaProvider>
```

Peer deps: `react >=19`, `@tanstack/react-query >=5`.

## Components

| Component | Purpose |
|---|---|
| `UploadZone` | Drag-and-drop file upload, drives the two-phase direct-upload flow |
| `DocumentSelector` | Pick among a user's previously uploaded documents |
| `StatusBanner` | Status/progress banner for an in-flight job |
| `StudentRecordsTable` | Renders extracted student records |
| `RecordDataGrid` | Editable grid view over extracted records |
| `PageDetailPanel` | Per-page detail/inspection view |
| `PipelineTimeline` | Visual timeline of the extraction pipeline stages |
| `StatsPanel` | Extraction stats (accuracy, pages, records) |
| `ChunkPageMap` | Maps processing chunks to source pages |
| `AnalysisJobPanel` | Full job status/progress panel — check `AnalysisJobPanelProps` in `@nexa-ed/react`'s `.d.ts` for props |
| `ResultsViewerSheet` | Slide-over sheet wrapping the full results-review UI — check `ResultsViewerSheetProps` |
| `StudentEmailAccountManager` | Manage a single student's email account (suspend/restore/reset password) |
| `EmailBulkProvisioningPanel` | Bulk student email provisioning UI |
| `NexaPaymentWidget` | Payment checkout widget — check `NexaPaymentWidgetProps` in the `.d.ts` for the exact prop shape before use |
| `EnrollmentPaymentFlow` | End-to-end enrollment + payment flow — check `EnrollmentPaymentFlowProps` |
| `PaymentConfigPanel` | Admin UI to view/update the platform fee configuration; calls `GET/POST /api/nexa/payments/config` automatically |
| `PaymentStatusDashboard` | Transaction list with search, status filter, date range, CSV export |

Also exported: small primitives (`Badge`, `StatusBadge`, `LoadingSpinner`, `SectionHeader`, `SortIcon`, `RowsPerPageSelect`, `HelpButton`, `RosterCell`) for building custom UI that matches the package's look.

For any component whose exact props aren't obvious from name + this list, read `node_modules/@nexa-ed/react/dist/index.d.ts` rather than guessing — it's generated straight from source and always current.

## Hooks

| Hook | Purpose |
|---|---|
| `useFileProgress(fileId)` | Subscribes to SSE extraction progress. Returns `{ fileStatus, progressPct, pagesProcessed, totalPages, chunksTotal, chunksComplete, chunksFailed, recordsExtracted, elapsedMs, etaMs, isComplete, isError, analysisJob, activeRetries, warnings, error }` |
| `useUploadFile()` | Drives the two-phase direct upload (prepare → upload). Returns upload state including `uploadProgress` (0–100, real byte-transfer progress) and `isDispatching` (server-side pipeline dispatch phase) |
| `useGetUserDocuments()` | Fetches the current user's document list |
| `useGetFileStudentRecords(fileId)` | Fetches extracted student records for a file |
| `useGetPageRecordsWithRefinement(...)` | Page-level records with LLM refinement support |
| `useGetLatestAnalysisJobForFile(fileId)` / `useGetAnalysisJobResult(jobId)` | Analysis job status/result |
| `useGetFileStatistics(fileId)` | File-level extraction stats |
| `useGetFileChunks` / `useGetChunksWithPages` | Chunk-level data |
| `useColumnSort`, `useUpdateRecordInList`, `useDeleteRecordFromList`, `useAddRowsToList`, `useSerialRenumber` | Local record-list editing helpers (optimistic list mutations, not server calls) |
| `useUpdatePageRecord` / `useDeletePageRecord` | Mutate a single page's record |
| `useRefinePageWithLLM` | Trigger LLM refinement on a page |
| `useGetRoster` | Fetch the tenant's student roster |
| `useBatchUpdateStudentRecords` / `useBatchCreateStudentRecordsFromImport` | Bulk record operations, e.g. after a CSV import |

All hooks must be called inside a `<NexaProvider>` subtree — they read `useNexaContext()` internally and throw/behave incorrectly outside it.

## Export/import utilities

`buildExportHeaders`, `downloadAsXlsx`, `downloadAsCsv`, `downloadAsJson`, `parseImportFile`, `buildImportDiff` — client-side helpers for exporting extracted records or importing/reconciling a roster file, no network calls.

## Usage sketch

```tsx
"use client";
import { UploadZone, useFileProgress, StudentRecordsTable, useGetFileStudentRecords } from "@nexa-ed/react";
import { useState } from "react";

export function ExtractPage() {
  const [fileId, setFileId] = useState<string | null>(null);
  const progress = useFileProgress(fileId ?? "");
  const { data: records } = useGetFileStudentRecords(fileId ?? "");

  return (
    <div>
      <UploadZone onUploaded={({ fileId }) => setFileId(fileId)} />
      {fileId && !progress.isComplete && <p>{progress.progressPct}%</p>}
      {progress.isComplete && records && <StudentRecordsTable records={records} />}
    </div>
  );
}
```

Verify `UploadZone`'s exact callback prop name against the `.d.ts` before shipping — treat the shape above as illustrative, not copy-paste-verified.
