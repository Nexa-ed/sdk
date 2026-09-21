export { NexaClient } from "./client";
export { NexaError, isNexaError } from "./error";
export { getSchoolBranding } from "./modules/branding";
export type { GetSchoolBrandingOptions } from "./modules/branding";
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
  BankTransferIntentOptions,
  BankTransferIntentResult,
  ConfirmBankTransferSentResult,

  // Tenant services
  TenantService,
  TenantServiceSubscription,
  GetServicesResponse,
  ServiceUsageResult,

  // Email provisioning
  EmailTier,
  EmailCreateOptions,
  EmailCreateResult,
  EmailBulkCreateOptions,
  EmailBulkCreateResult,
  EmailJobStatus,
  EmailListResult,
  EmailStats,
  StudentEmailAccount,

  // Webhooks
  WebhookFileCompleteEvent,
  WebhookPaymentEvent,
  WebhookEmailCreatedEvent,
  WebhookEmailStatusChangedEvent,
  WebhookEmailBulkCompletedEvent,
  WebhookEvent,
} from "./types";
