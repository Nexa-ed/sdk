export { NexaClient } from "./client";
export { NexaError, isNexaError } from "./error";
export type { NexaConfig } from "./config";

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
  PaymentStatus,
  PaymentTransaction,
  PaymentStatsResponse,

  // Tenant services
  TenantService,
  GetServicesResponse,

  // Webhooks
  WebhookFileCompleteEvent,
  WebhookEvent,
} from "./types";
