// ─── Extraction ──────────────────────────────────────────────────────────────

export type ExtractionType =
  | "results"
  | "attendance"
  | "enrollment"
  | "assessment";

// ─── File Processing ─────────────────────────────────────────────────────────

export interface FileSubmitOptions {
  /** URL of the file to process (e.g. from UploadThing) */
  fileUrl: string;
  /** The current user's ID in your system */
  userId: string;
  /** What kind of document this is */
  extractionType: ExtractionType;
  /** Optional processor type override */
  processorType?: string;
  /** Optional user email for record-keeping */
  userEmail?: string;
  /** Optional user display name */
  userName?: string;
}

export interface FileSubmitResult {
  success: boolean;
  jobId: string;
  status: "pending";
  fastapiFileIds: string[];
  message?: string;
}

export type FileStatus =
  | "pending"
  | "uploading"
  | "processing"
  | "chunking"
  | "ocr"
  | "analyzing"
  | "completed"
  | "failed";

export interface FileProgressEvent {
  type: "progress" | "complete" | "error" | "ping";
  fileStatus?: FileStatus;
  progressPct?: number;
  totalPages?: number;
  pagesProcessed?: number;
  chunksTotal?: number;
  chunksComplete?: number;
  chunksFailed?: number;
  recordsExtracted?: number;
  elapsedMs?: number;
  etaMs?: number;
  analysisJob?: AnalysisJob;
  warnings?: string[];
  message?: string;
}

// ─── Documents ───────────────────────────────────────────────────────────────

export interface UserDocument {
  id: string;
  fileUrl: string;
  fileType: string | null;
  status: FileStatus;
  originalFileName: string | null;
  fileSize: number | null;
  totalPages: number | null;
  totalChunkCount: number | null;
  documentTitle: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  pagesProcessed: number;
  completedChunkCount: number;
  failedChunkCount: number;
  recordCount: number;
  progressPercentage: number;
}

export interface GetUserDocumentsResponse {
  documents: UserDocument[];
  totalDocuments: number;
}

export interface StudentRecord {
  id: string;
  fileId: string;
  chunkId: string;
  tableId: string | null;
  pageNumber: number;
  recordNumberForPage: number;
  studentName: string | null;
  rawData: Record<string, unknown> | null;
  normalizedData: Record<string, unknown> | null;
  isCurrent: number;
  isLlmDiscovered: number;
  llmNotes: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  tableWarnings: unknown | null;
  tableStatus: string | null;
  hasEmbedding: boolean;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export interface StudentRecordsResponse {
  items: StudentRecord[];
  pagination: Pagination;
}

export interface GetStudentRecordsOptions {
  page?: number;
  limit?: number;
  filters?: {
    pageStart?: number;
    pageEnd?: number;
    hasWarnings?: boolean;
  };
}

export interface AnalysisJob {
  id: string;
  fileId: string;
  userId: string;
  status: "pending" | "running" | "completed" | "failed";
  result: Record<string, unknown> | null;
  errorMessage: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface FileDetails {
  id: string;
  userId: string;
  fileUrl: string;
  originalFileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  status: FileStatus;
  totalPages: number | null;
  totalChunkCount: number | null;
  documentTitle: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface RefinementResult {
  success: boolean;
  transactionCount: number;
  correctionsCount?: number;
  processingTimeMs: number;
  aiObservations: string[];
  overallSummary: string;
}

export interface SubjectGroup {
  name: string;
  description: string;
  studentRecordIds: string[];
}

// ─── Payments ────────────────────────────────────────────────────────────────

export interface PaymentInitializeOptions {
  /** Student or payer email address */
  email: string;
  /** Amount in the smallest currency unit (e.g. kobo for NGN) */
  amount: number;
  /** Net amount after fees/deductions */
  netAmount: number;
  /** Arbitrary key-value metadata stored against the payment */
  metadata: Record<string, unknown>;
}

export interface PaymentInitializeResult {
  paymentUrl: string;
  reference: string;
  accessCode?: string;
}

export type PaymentStatus = "pending" | "success" | "failed" | "cancelled";

export interface PaymentTransaction {
  id: string;
  reference: string;
  amount: number;
  status: PaymentStatus;
  email: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface PaymentStatsResponse {
  totalRevenue: number;
  successfulCount: number;
  failedCount: number;
  pendingCount: number;
}

// ─── Tenant Services ─────────────────────────────────────────────────────────

export interface TenantService {
  serviceId: string;
  name: string;
  description: string;
  category: string;
  status: "active" | "inactive" | "pending";
  config: Record<string, unknown>;
  subscription: Record<string, unknown> | null;
  availableTiers: string[];
  features: string[];
  documentation: string | null;
}

export interface GetServicesResponse {
  services: TenantService[];
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export interface WebhookFileCompleteEvent {
  event: "file.completed";
  fileId: string;
  userId: string;
  tenantId: string;
  timestamp: string;
}

export type WebhookEvent = WebhookFileCompleteEvent;
