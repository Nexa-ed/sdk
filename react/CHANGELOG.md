# @nexa-ed/react

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

#### New Components

- `StudentEmailAccountManager` — UI for viewing and managing student email accounts
- `EmailBulkProvisioningPanel` — step-through UI for bulk-provisioning email accounts via async job
- `EnrollmentPaymentFlow` — complete enrollment + payment flow component
- `NexaPaymentWidget` — embeddable payment widget (Paystack-backed)
- `PaymentConfigPanel` — payment configuration UI for school admins
- `PaymentStatusDashboard` — real-time dashboard showing payment pipeline status
- `ResultsViewerSheet` — slide-over sheet for viewing student academic results
- `StudentRecordsTable` — sortable, paginated table for student records
- `RecordDataGrid` — editable grid for page-level record data
- `AnalysisJobPanel` — status panel for document analysis jobs
- `PipelineTimeline` — visual timeline of file processing pipeline steps
- `ChunkPageMap` — page-level chunk navigation map
- `DocumentSelector` — document picker component
- `PageDetailPanel` — detail panel for individual document pages
- `StatsPanel` — summary statistics panel
- `StatusBanner` — contextual status/alert banner
- `UploadZone` — drag-and-drop file upload zone

#### New Hooks

- `useUploadFile` — upload files to Nexa with progress tracking
- `useFileProgress` — subscribe to real-time file processing progress
- `useGetUserDocuments` — fetch the current user's documents
- `useGetFileChunks` — fetch page chunks for a processed file
- `useGetFileStudentRecords` — fetch student records extracted from a file
- `useGetPageRecords` — fetch records for a specific page
- `useGetAnalysisJob` — poll or subscribe to an analysis job
- `useGetFileStats` — get processing statistics for a file
- `useRefinePageWithLLM` — trigger LLM refinement on a page
- `useUpdatePageRecord` / `useUpdateRecordInList` — update record fields
- `useDeletePageRecord` / `useDeleteRecordFromList` — remove records
- `useAddRowsToList` / `useSerialRenumber` — list editing utilities
- `useColumnSort` / `useGridNavigation` — table/grid UX helpers

#### Email Types

- Added `email-types.ts` — all email provisioning types consumed by email components

#### Payment Utilities

- `feeCalculation` — Paystack fee breakdown helpers
- `paymentMetadata` — utilities for building Paystack metadata payloads

#### Primitives

- `Badge`, `HelpModal`, `LoadingSpinner`, `RowsPerPageSelect`, `SectionHeader`, `SortIcon`

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
