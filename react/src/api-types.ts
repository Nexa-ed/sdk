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
};

export type FileChunksResult = {
  items: FileChunk[];
  pagination: StudentRecordsPagination;
};

export type FileStatisticsResult = {
  totalRecords: number;
  totalPages: number;
  chunksComplete: number;
  chunksTotal: number;
  chunksFailed: number;
  recordsWithWarnings: number;
  llmRefinedPages: number;
};

export type AnalysisJob = {
  id: string;
  fileId: string;
  userId: string;
  status: string;
  pagesProcessed: number | null;
  totalPages: number | null;
  result: unknown;
  createdAt: number | null;
  updatedAt: number | null;
};

export type PageRecordResult = {
  records: StudentRecord[];
  hasLLMRefinement: boolean;
  pageNumber: number;
};
