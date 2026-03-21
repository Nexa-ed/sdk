/**
 * Response shape types that mirror the Nexa platform API outputs.
 * Defined here so @nexa-ed/react has no runtime dependency on @repo/api or @repo/db.
 */

export type UserDocument = {
  id: string;
  originalFileName: string | null;
  status: string;
  progressPercentage: number | null;
  fileUrl: string | null;
  fileType: string | null;
  fileSize: number | null;
  totalPages: number | null;
  documentTitle: string | null;
  createdAt: number | null;
  updatedAt: number | null;
};

export type UserDocumentsResult = {
  documents: UserDocument[];
  totalDocuments: number;
};

export type StudentRecord = {
  id: string;
  fileId: string;
  pageNumber: number | null;
  recordNumberForPage: number | null;
  recordData: Record<string, string | null> | null;
  isCurrent: number;
  warnings: unknown;
  tableWarnings: unknown;
  tableStatus: string | null;
  hasEmbedding: boolean;
};

export type StudentRecordsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type StudentRecordsResult = {
  items: StudentRecord[];
  pagination: StudentRecordsPagination;
};

export type FileChunk = {
  id: string;
  fileId: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  status: string;
  ocrProcessingTimeMs?: number | null;
  llmProcessingTimeMs?: number | null;
};

export type FileChunksResult = {
  items: FileChunk[];
  pagination: StudentRecordsPagination;
};

export type ChunkPage = {
  pageNumber: number;
  tableId: string | null;
  status: string | null;
  transactionCount: number | null;
  hasLLMRefinement: boolean;
};

export type ChunkWithPages = {
  chunkId: string;
  chunkIndex: number;
  pageStart: number;
  pageEnd: number;
  status: string;
  ocrProcessingTimeMs?: number | null;
  llmProcessingTimeMs?: number | null;
  pages: ChunkPage[];
};

export type FileStatisticsResult = {
  chunks: {
    successRate: number;
    completed: number;
    total: number;
    byStatus?: Array<{ status: string; count: number }>;
  };
  records: {
    total: number;
  };
  file: {
    processingTimeMs: number | null;
  };
  retries: {
    totalWaves: number;
    pagesRetried: number;
    pagesWithWarnings: number;
    waves?: unknown[];
  };
};

export type AnalysisJob = {
  jobId?: string;
  id?: string;
  fileId: string;
  userId?: string;
  status: string;
  pagesProcessed: number | null;
  totalPages: number | null;
  currentPage?: number | null;
  result: unknown;
  errorMessage?: string | null;
  createdAt: number | null;
  updatedAt: number | null;
};

export type PageRecordResult = {
  pageNumber: number;
  tableId: string | null;
  ocrRecords: StudentRecord[];
  llmTransactions: Record<string, unknown>[];
  hasRefinement: boolean;
  descriptionColumnKey: string | null;
};
