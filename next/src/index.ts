export { createNexa } from "./create-nexa";
export { createRouteHandler } from "./route-handler";

// Re-export core SDK for convenience — tenant apps only need to install @nexa-ed/next
export {
  NexaClient,
  NexaError,
  isNexaError,
} from "@nexa-ed/sdk";

export type {
  NexaConfig,
  ExtractionType,
  FileSubmitOptions,
  FileSubmitResult,
  FileStatus,
  FileProgressEvent,
  UserDocument,
  GetUserDocumentsResponse,
  StudentRecord,
  StudentRecordsResponse,
  GetStudentRecordsOptions,
  AnalysisJob,
  FileDetails,
  RefinementResult,
  PaymentInitializeOptions,
  PaymentInitializeResult,
  PaymentStatus,
  PaymentTransaction,
  TenantService,
  WebhookEvent,
  WebhookFileCompleteEvent,
} from "@nexa-ed/sdk";

export type { NexaNextConfig, NexaInstance } from "./types";
