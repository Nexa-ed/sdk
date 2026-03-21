import type { WebhookEvent } from "@nexa-ed/sdk";

/**
 * Configuration passed to `createNexa()`.
 */
export interface NexaNextConfig {
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
   * Only needed when pointing at a local Nexa instance during platform development.
   */
  baseUrl?: string;

  /**
   * Resolve the current user from an incoming Next.js request.
   *
   * Called by the route handler before proxying SSE progress streams and
   * oRPC requests, so Nexa can scope the response to the right user.
   *
   * This is intentionally auth-provider agnostic — wire in Clerk, NextAuth,
   * or any session system you use:
   *
   * @example
   * // Clerk
   * import { auth } from "@clerk/nextjs/server";
   * getUser: async () => {
   *   const { userId } = await auth();
   *   if (!userId) throw new Error("Unauthorized");
   *   return { userId };
   * },
   *
   * @example
   * // NextAuth
   * getUser: async (req) => {
   *   const session = await getServerSession(authOptions);
   *   if (!session?.user?.id) throw new Error("Unauthorized");
   *   return { userId: session.user.id };
   * },
   */
  getUser: (request: Request) => Promise<{ userId: string }>;

  /**
   * Called when Nexa delivers a `file.completed` webhook to your app.
   *
   * This is the right place to sync extracted student records into your
   * own database, send notifications, or trigger follow-up logic.
   *
   * @example
   * onFileComplete: async ({ fileId, userId, tenantId }) => {
   *   await syncRecordsToConvex(fileId, userId);
   * },
   */
  onFileComplete?: (event: Extract<WebhookEvent, { event: "file.completed" }>) => Promise<void>;

  /**
   * Called when Nexa forwards a completed payment event to your app.
   *
   * Use this to persist payment records in your own database.
   *
   * @example
   * onPaymentComplete: async ({ reference, amount, customerEmail, tenantId }) => {
   *   await convex.mutation(api.payments.upsertFromNexa, { reference, amount, customerEmail });
   * },
   */
  onPaymentComplete?: (event: Extract<WebhookEvent, { event: "payment.completed" }>) => Promise<void>;
}

/**
 * The object returned by `createNexa()`.
 * Carries the resolved config and callbacks consumed by `createRouteHandler()`.
 */
export interface NexaInstance {
  /** @internal */
  _config: {
    apiKey: string;
    webhookSecret: string;
    baseUrl: string;
  };
  /** @internal */
  _getUser: NexaNextConfig["getUser"];
  /** @internal */
  _onFileComplete?: NexaNextConfig["onFileComplete"];
  /** @internal */
  _onPaymentComplete?: NexaNextConfig["onPaymentComplete"];
}
