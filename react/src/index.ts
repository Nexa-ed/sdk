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

// Hooks
export { useFileProgress } from "./hooks/useFileProgress";
export { useGetUserDocuments } from "./hooks/useGetUserDocuments";
export { useGetFileStudentRecords } from "./hooks/useGetFileStudentRecords";
export { useGetPageRecordsWithRefinement } from "./hooks/useGetPageRecords";
export { useGetLatestAnalysisJobForFile, useGetAnalysisJobResult } from "./hooks/useGetAnalysisJob";
export { useGetFileStatistics } from "./hooks/useGetFileStats";
export { useGetFileChunks, useGetChunksWithPages } from "./hooks/useGetFileChunks";
export { useColumnSort } from "./hooks/useColumnSort";

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
  FileStatisticsResult,
  AnalysisJob,
  PageRecordResult,
} from "./api-types";
export { TABS } from "./types";
export { fmtMs, statusColor, stageRing, stageRow, stageLine, stageText, pageColor, accuracyBar } from "./utils";
export type { SortDir } from "./hooks/useColumnSort";
export type { FileProgressData, AnalysisJobProgress } from "./hooks/useFileProgress";
export type { UploadZoneProps } from "./components/UploadZone";
