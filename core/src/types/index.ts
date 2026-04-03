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
  /** Net amount after fees/deductions (optional — computed by Nexa if omitted) */
  netAmount?: number;
  /** Arbitrary key-value metadata stored against the payment */
  metadata: Record<string, unknown>;
  /**
   * URL Paystack redirects to after the payment flow completes.
   * Defaults to the tenant callback URL configured in the Nexa dashboard.
   */
  callbackUrl?: string;
}

export interface PaymentInitializeResult {
  /** Full Paystack authorization URL to redirect the user to */
  paymentUrl: string;
  /** Alias for paymentUrl — some Nexa versions return this field name */
  authorizationUrl?: string;
  /** Nexa/Paystack payment reference for verification */
  reference: string;
  accessCode?: string;
}

export type PaymentStatus = "pending" | "success" | "failed" | "cancelled" | "abandoned";

export interface PaymentTransaction {
  id?: string;
  reference: string;
  amount: number;
  status: PaymentStatus;
  /** Alias used in some Nexa API versions */
  transactionStatus?: string;
  email?: string;
  customerEmail?: string;
  tenantId?: string;
  metadata: Record<string, unknown> | null;
  amountPaid?: number;
  fees?: number;
  netAmount?: number;
  paidAt?: string | null;
  channel?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
}

export interface PaymentVerifyResult {
  success: boolean;
  status?: PaymentStatus;
  transaction?: PaymentTransaction;
}

export interface PaymentConfig {
  tenantId?: string;
  isActive: boolean;
  mode: "test" | "live";
  publicKey?: string;
  bankDetails?: Record<string, unknown>;
  customBranding?: {
    /** May be returned as businessName or schoolName depending on Nexa version */
    businessName?: string;
    schoolName?: string;
    supportEmail?: string;
    logo?: string;
  };
}

export interface PaymentConfigResult {
  success: boolean;
  config: PaymentConfig;
  cached?: boolean;
}

export interface PaymentSyncResult {
  success: boolean;
  payload?: PaymentTransaction & Record<string, unknown>;
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

// ─── Email Provisioning ──────────────────────────────────────────────────────

/**
 * Which email infrastructure tier a school is on.
 * Determined by the tenant's subscription — configured once in `createNexa()`.
 */
export type EmailTier = "tier-1-nexa" | "tier-2-stalwart" | "tier-3-google";

/** Options for creating a single student email account */
export interface EmailCreateOptions {
  /** The student's ID in your own system */
  studentId: string;
  firstName: string;
  lastName: string;
  /**
   * Explicit email address. If omitted, Nexa generates one from
   * `firstName.lastName@<your-domain>`.
   */
  email?: string;
  /** Grade/class label (e.g. "SS2") — used for organisational grouping */
  gradeLevel?: string;
  /** Student's personal email for account recovery */
  recoveryEmail?: string;
}

/** Result of creating a single student email account */
export interface EmailCreateResult {
  /** The provisioned email address */
  email: string;
  /** Temporary password — student must change on first login */
  temporaryPassword: string;
  /** Provider-specific user ID (Google userId, Stalwart name) */
  providerUserId: string;
  /** Which tier was used (mirrors what was configured) */
  tier: EmailTier;
}

/** Options for bulk-creating student email accounts */
export interface EmailBulkCreateOptions {
  /** Up to 500 students per request */
  students: EmailCreateOptions[];
}

/** Result of starting a bulk provisioning job */
export interface EmailBulkCreateResult {
  /** UUID of the provisioning job — poll `getJobStatus(jobId)` for progress */
  jobId: string;
  tier: EmailTier;
  totalStudents: number;
  message: string;
}

/** Status of a bulk provisioning job */
export interface EmailJobStatus {
  jobId: string;
  status: "pending" | "processing" | "completed" | "failed";
  type: string;
  totalStudents: number;
  processedCount: number;
  successCount: number;
  failedCount: number;
  results?: Array<{
    studentId: string;
    email?: string;
    status: string;
    error?: string;
  }>;
  error?: string;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
}

/** A provisioned student email account record */
export interface StudentEmailAccount {
  tenantId: string;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  provider?: "nexa" | "stalwart" | "google";
  providerUserId: string;
  status: "active" | "suspended" | "deleted" | "deleting";
  passwordResetRequired: boolean;
  recoveryEmail?: string;
  aliases?: string[];
  createdAt: number;
  updatedAt: number;
}

// ─── Webhooks ────────────────────────────────────────────────────────────────

export interface WebhookFileCompleteEvent {
  event: "file.completed";
  fileId: string;
  userId: string;
  tenantId: string;
  timestamp: string;
}

export interface WebhookPaymentEvent {
  event: "payment.completed";
  reference: string;
  tenantId: string;
  /** Payment status at the time of the event */
  status: "success" | "pending" | "failed" | "abandoned";
  /** Amount in smallest currency unit (e.g. kobo for NGN) */
  amount: number;
  customerEmail: string;
  /** Amount actually received after fees */
  amountPaid?: number;
  fees?: number;
  platformFee?: number;
  netAmount?: number;
  paidAt?: string;
  channel?: string;
  failureReason?: string;
  /** Unix timestamp (ms) — when the transaction was created on Nexa */
  createdAt: number;
  /** Unix timestamp (ms) — when the transaction was last updated */
  updatedAt: number;
  /** ISO 8601 string from the webhook delivery (not the same as createdAt) */
  timestamp?: string;
  [key: string]: unknown;
}

/** Fired after a single student email account is successfully provisioned */
export interface WebhookEmailCreatedEvent {
  event: "email.created";
  tenantId: string;
  studentId: string;
  email: string;
  firstName: string;
  lastName: string;
  gradeLevel?: string;
  provider: "nexa" | "stalwart" | "google";
  providerUserId: string;
  tier: EmailTier;
  /** Unix timestamp (ms) */
  createdAt: number;
}

/** Fired when an account is suspended or restored */
export interface WebhookEmailStatusChangedEvent {
  event: "email.status_changed";
  tenantId: string;
  email: string;
  studentId: string;
  previousStatus: "active" | "suspended";
  status: "active" | "suspended";
  /** Unix timestamp (ms) */
  changedAt: number;
}

/**
 * Fired when a bulk provisioning job reaches completed or failed.
 *
 * Payload is intentionally lean — counts only.
 * Call nexa.email.getJobStatus(jobId) to fetch the full per-student results
 * (individual emails, error details, etc.).
 */
export interface WebhookEmailBulkCompletedEvent {
  event: "email.bulk_completed";
  tenantId: string;
  jobId: string;
  status: "completed" | "failed";
  totalStudents: number;
  successCount: number;
  failedCount: number;
  /** Unix timestamp (ms) */
  completedAt: number;
}

export type WebhookEvent =
  | WebhookFileCompleteEvent
  | WebhookPaymentEvent
  | WebhookEmailCreatedEvent
  | WebhookEmailStatusChangedEvent
  | WebhookEmailBulkCompletedEvent;
