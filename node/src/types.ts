import type { WebhookEvent } from "@nexa-ed/sdk";

/**
 * Configuration for the Node.js adapter.
 */
export interface NexaNodeConfig {
  /** Your Nexa API key — from the Nexa dashboard under Settings → API Keys. */
  apiKey: string;

  /**
   * Webhook signing secret — from the Nexa dashboard under Webhooks.
   * Used to verify every incoming webhook payload from Nexa.
   */
  webhookSecret: string;

  /**
   * Optional base URL override.
   * Defaults to `https://nexa-ed.com`.
   */
  baseUrl?: string;

  /**
   * Called when Nexa delivers a `file.completed` webhook to your app.
   *
   * Sync extracted student records into your database, send notifications,
   * or trigger follow-up logic here.
   */
  onFileComplete?: (
    event: Extract<WebhookEvent, { event: "file.completed" }>,
  ) => Promise<void>;

  /**
   * Called when Nexa forwards a completed payment event to your app.
   *
   * Persist payment records in your own database here.
   */
  onPaymentComplete?: (
    event: Extract<WebhookEvent, { event: "payment.completed" }>,
  ) => Promise<void>;
}

/** Subset of NexaNodeConfig needed by webhook handlers. */
export type WebhookHandlerConfig = Pick<
  NexaNodeConfig,
  "webhookSecret" | "onFileComplete" | "onPaymentComplete"
>;
