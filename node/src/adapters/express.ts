import type { Request, Response, NextFunction, RequestHandler } from "express";
import { verifyWebhookPayload } from "../verify";
import type { WebhookHandlerConfig } from "../types";
import type { WebhookEvent } from "@nexa-ed/sdk";

/**
 * Create an Express route handler for Nexa webhooks.
 *
 * IMPORTANT: Mount `express.raw({ type: "application/json" })` before this
 * handler on the webhook route so Express preserves the raw body string that
 * the signature check needs. If you use `express.json()` globally, override
 * it per-route as shown below.
 *
 * @example
 * import express from "express";
 * import { createWebhookHandler } from "@nexa-ed/node/express";
 *
 * const app = express();
 *
 * app.post(
 *   "/webhooks/nexa",
 *   express.raw({ type: "application/json" }),   // ← preserves raw body
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
 */
export function createWebhookHandler(config: WebhookHandlerConfig): RequestHandler {
  return async (req: Request, res: Response, _next: NextFunction) => {
    try {
      // express.raw() gives us a Buffer; express.json() gives a parsed object.
      // We normalise both to a plain string for signature verification.
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString("utf-8")
        : typeof req.body === "string"
          ? req.body
          : JSON.stringify(req.body);

      const rawSig = req.headers["x-nexa-signature"];
      const rawTs = req.headers["x-nexa-timestamp"];
      const signature = Array.isArray(rawSig) ? rawSig[0] : rawSig;
      const timestamp = Array.isArray(rawTs) ? rawTs[0] : rawTs;

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

      res.status(200).json({ received: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status ?? 500;
      const message = (err as Error).message ?? "Webhook error";
      res.status(status).json({ error: message });
    }
  };
}
