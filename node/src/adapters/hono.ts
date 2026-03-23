import type { Context } from "hono";
import { verifyWebhookPayload } from "../verify";
import type { WebhookHandlerConfig } from "../types";
import type { WebhookEvent } from "@nexa-ed/sdk";

/**
 * Create a Hono route handler for Nexa webhooks.
 *
 * Hono gives us the raw body via `c.req.text()`, so no extra middleware is
 * needed — just mount the handler directly on your webhook route.
 *
 * @example
 * import { Hono } from "hono";
 * import { createWebhookHandler } from "@nexa-ed/node/hono";
 *
 * const app = new Hono();
 *
 * app.post(
 *   "/webhooks/nexa",
 *   createWebhookHandler({
 *     webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
 *     onFileComplete: async (event) => {
 *       await syncRecords(event.fileId, event.userId);
 *     },
 *     onPaymentComplete: async (event) => {
 *       await recordPayment(event.reference, event.amount);
 *     },
 *   }),
 * );
 *
 * export default app;
 */
export function createWebhookHandler(config: WebhookHandlerConfig) {
  return async (c: Context) => {
    try {
      const rawBody = await c.req.text();
      const signature = c.req.header("x-nexa-signature");
      const timestamp = c.req.header("x-nexa-timestamp");

      const event = await verifyWebhookPayload<WebhookEvent>(
        rawBody,
        signature,
        timestamp,
        config.webhookSecret,
      );

      if (event.event === "file.completed" && config.onFileComplete) {
        await config.onFileComplete(
          event as Extract<WebhookEvent, { event: "file.completed" }>,
        );
      }

      if (event.event === "payment.completed" && config.onPaymentComplete) {
        await config.onPaymentComplete(
          event as Extract<WebhookEvent, { event: "payment.completed" }>,
        );
      }

      return c.json({ received: true });
    } catch (err: unknown) {
      const status = typeof (err as { status?: unknown }).status === "number"
        ? (err as { status: number }).status
        : 500;
      // Expose the error message for client errors; use a generic string for 5xx
      // to avoid leaking internal details.
      const message = status < 500 && err instanceof Error
        ? err.message
        : "Webhook error";
      return c.json({ error: message }, status as Parameters<typeof c.json>[1]);
    }
  };
}
