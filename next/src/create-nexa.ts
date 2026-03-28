import { NexaClient } from "@nexa-ed/sdk";
import type { NexaNextConfig, NexaInstance } from "./types";

/**
 * Configure your Nexa integration. Call this once in a shared module
 * (e.g. `lib/nexa.ts`) and export the result.
 *
 * @example
 * // lib/nexa.ts
 * import { createNexa } from "@nexa-ed/next";
 * import { auth } from "@clerk/nextjs/server";
 *
 * export const nexa = createNexa({
 *   apiKey: process.env.NEXA_API_KEY!,
 *   webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
 *   getUser: async () => {
 *     const { userId } = await auth();
 *     if (!userId) throw new Error("Unauthorized");
 *     return { userId };
 *   },
 *   onFileComplete: async ({ fileId, userId }) => {
 *     // sync records into your database here
 *   },
 * });
 */
export function createNexa(config: NexaNextConfig): NexaInstance & NexaClient {
  if (!config.apiKey) {
    throw new Error("[nexa-ed] apiKey is required. Get yours from the Nexa dashboard.");
  }
  if (!config.webhookSecret) {
    throw new Error(
      "[nexa-ed] webhookSecret is required. Get yours from the Nexa dashboard under Webhooks.",
    );
  }
  if (typeof config.getUser !== "function") {
    throw new Error(
      "[nexa-ed] getUser is required. Provide an async function that returns { userId } for the current request.",
    );
  }

  const resolvedBaseUrl =
    config.baseUrl?.replace(/\/+$/, "") ?? "https://nexa-ed.com";

  // The core NexaClient handles all API calls
  const client = new NexaClient({
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret,
    baseUrl: resolvedBaseUrl,
    email: config.email,
  });

  // Attach Next.js-specific internals
  const instance = client as NexaClient & NexaInstance;
  instance._config = {
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret,
    baseUrl: resolvedBaseUrl,
  };
  instance._getUser = config.getUser;
  instance._onFileComplete = config.onFileComplete;
  instance._onPaymentComplete = config.onPaymentComplete;

  return instance;
}
