export { verifyWebhookPayload } from "./verify";
export { proxyProgressStream } from "./progress";
export type { NexaNodeConfig, WebhookHandlerConfig } from "./types";

// Re-export core SDK — consumers only need to install @nexa-ed/node
export { NexaClient, NexaError, isNexaError } from "@nexa-ed/sdk";
export type {
  NexaConfig,
  WebhookEvent,
  WebhookFileCompleteEvent,
  WebhookPaymentEvent,
  FileSubmitOptions,
  FileSubmitResult,
  FileStatus,
  FileProgressEvent,
  UserDocument,
  StudentRecord,
  AnalysisJob,
  PaymentInitializeOptions,
  PaymentInitializeResult,
  PaymentStatus,
  PaymentTransaction,
  TenantService,
} from "@nexa-ed/sdk";
