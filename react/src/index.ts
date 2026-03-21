"use client";

/**
 * @nexa-ed/react
 *
 * Pre-built React components and hooks for the Nexa Education Platform.
 *
 * Usage:
 * 1. Wrap your app with `NexaProvider` (inside `QueryClientProvider`)
 * 2. Use hooks and components directly — they pick up context automatically
 *
 * @example
 * ```tsx
 * import { NexaProvider, UploadZone, StatusBanner } from "@nexa-ed/react";
 *
 * <QueryClientProvider client={queryClient}>
 *   <NexaProvider basePath="/api/nexa">
 *     <UploadZone onUpload={...} onFileQueued={...} />
 *   </NexaProvider>
 * </QueryClientProvider>
 * ```
 */

// Provider & context
export { NexaProvider, useNexaContext } from "./context";

// Components
export { UploadZone } from "./components/UploadZone";
export { DocumentSelector } from "./components/DocumentSelector";
export { StatusBanner } from "./components/StatusBanner";
export { StudentRecordsTable } from "./components/StudentRecordsTable";
export { RecordDataGrid } from "./components/RecordDataGrid";
export { PageDetailPanel } from "./components/PageDetailPanel";
export { PipelineTimeline } from "./components/PipelineTimeline";
export { StatsPanel } from "./components/StatsPanel";
export { ChunkPageMap } from "./components/ChunkPageMap";
export { AnalysisJobPanel } from "./components/AnalysisJobPanel";
export type { AnalysisJobPanelProps } from "./components/AnalysisJobPanel";
export { ResultsViewerSheet } from "./components/ResultsViewerSheet";
export type { ResultsViewerSheetProps } from "./components/ResultsViewerSheet";

// Hooks
export { useFileProgress } from "./hooks/useFileProgress";
export { useUploadFile } from "./hooks/useUploadFile";
export type { UploadFileResult } from "./hooks/useUploadFile";
export { useGetUserDocuments } from "./hooks/useGetUserDocuments";
export { useGetFileStudentRecords } from "./hooks/useGetFileStudentRecords";
export { useGetPageRecordsWithRefinement } from "./hooks/useGetPageRecords";
export { useGetLatestAnalysisJobForFile, useGetAnalysisJobResult } from "./hooks/useGetAnalysisJob";
export { useGetFileStatistics } from "./hooks/useGetFileStats";
export { useGetFileChunks, useGetChunksWithPages } from "./hooks/useGetFileChunks";
export { useColumnSort } from "./hooks/useColumnSort";
export { useUpdateRecordInList } from "./hooks/useUpdateRecordInList";
export { useDeleteRecordFromList } from "./hooks/useDeleteRecordFromList";
export { useAddRowsToList } from "./hooks/useAddRowsToList";
export { useSerialRenumber } from "./hooks/useSerialRenumber";
export { useUpdatePageRecord } from "./hooks/useUpdatePageRecord";
export { useDeletePageRecord } from "./hooks/useDeletePageRecord";
export { useRefinePageWithLLM } from "./hooks/useRefinePageWithLLM";

// Primitives
export { Badge, StatusBadge } from "./primitives/Badge";
export { LoadingSpinner } from "./primitives/LoadingSpinner";
export { SectionHeader } from "./primitives/SectionHeader";
export { SortIcon } from "./primitives/SortIcon";
export { RowsPerPageSelect } from "./primitives/RowsPerPageSelect";
export { HelpButton } from "./primitives/HelpModal";

// Types & utilities
export type { RecordRow, CellEdit, ActiveBar, UploadState, StageStatus, Tab } from "./types";
export type {
  UserDocument,
  UserDocumentsResult,
  StudentRecord,
  StudentRecordsResult,
  FileChunk,
  FileChunksResult,
  ChunkPage,
  ChunkWithPages,
  FileStatisticsResult,
  AnalysisJob,
  PageRecordResult,
} from "./api-types";
export { TABS } from "./types";
export { fmtMs, statusColor, stageRing, stageRow, stageLine, stageText, pageColor, accuracyBar } from "./utils";
export type { SortDir } from "./hooks/useColumnSort";
export type { FileProgressData, AnalysisJobProgress } from "./hooks/useFileProgress";
export type { UploadZoneProps } from "./components/UploadZone";
export type { PipelineTimelineProps } from "./components/PipelineTimeline";

// Payment components
export { NexaPaymentWidget } from "./components/NexaPaymentWidget";
export type { NexaPaymentWidgetProps } from "./components/NexaPaymentWidget";
export { EnrollmentPaymentFlow } from "./components/EnrollmentPaymentFlow";
export type { EnrollmentPaymentFlowProps } from "./components/EnrollmentPaymentFlow";
export { PaymentConfigPanel } from "./components/PaymentConfigPanel";
export type { PaymentConfigPanelProps } from "./components/PaymentConfigPanel";
export { PaymentStatusDashboard } from "./components/PaymentStatusDashboard";
export type { PaymentStatusDashboardProps } from "./components/PaymentStatusDashboard";

// Payment types & utilities
export type {
  PaymentMetadata,
  PaymentTransaction,
  PaymentConfig,
  PaymentError,
  TransactionFilters,
  PaymentStats,
} from "./payment-types";
export { calculateTotalAmountFromNetAmount } from "./utils/feeCalculation";
export {
  normalizePaymentMetadata,
  getValidPaymentCategory,
} from "./utils/paymentMetadata";
export type { PaymentSource, PaymentCategory } from "./utils/paymentMetadata";
