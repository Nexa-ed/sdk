export { NexaClient } from "./client";
export { NexaError, isNexaError } from "./error";
export type { NexaConfig, NexaEmailConfig } from "./config";

// All public types
export type {
  // Extraction
  ExtractionType,

  // File processing
  FileSubmitOptions,
  FileSubmitResult,
  FileStatus,
  FileProgressEvent,

  // Documents
  UserDocument,
  GetUserDocumentsResponse,
  StudentRecord,
  StudentRecordsResponse,
  GetStudentRecordsOptions,
  Pagination,
  AnalysisJob,
  FileDetails,
  RefinementResult,
  SubjectGroup,

  // Payments
  PaymentInitializeOptions,
  PaymentInitializeResult,
  PaymentVerifyResult,
  PaymentConfig,
  PaymentConfigResult,
  PaymentSyncResult,
  PaymentStatus,
  PaymentTransaction,
  PaymentStatsResponse,

  // Tenant services
  TenantService,
  GetServicesResponse,

  // Email provisioning
  EmailTier,
  EmailCreateOptions,
  EmailCreateResult,
  EmailBulkCreateOptions,
  EmailBulkCreateResult,
  EmailJobStatus,
  StudentEmailAccount,

  // Webhooks
  WebhookFileCompleteEvent,
  WebhookPaymentEvent,
  WebhookEvent,
} from "./types";
