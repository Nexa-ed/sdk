import type { FastifyRequest, FastifyReply } from "fastify";
import { verifyWebhookPayload } from "../verify";
import type { WebhookHandlerConfig } from "../types";
import type { WebhookEvent } from "@nexa-ed/sdk";

/**
 * Create a Fastify route handler for Nexa webhooks.
 *
 * IMPORTANT: Fastify's built-in JSON parser consumes and transforms the body
 * before route handlers run. To preserve the raw string for signature
 * verification, add a content-type parser for this route:
 *
 * @example
 * import Fastify from "fastify";
 * import { createWebhookHandler } from "@nexa-ed/node/fastify";
 *
 * const app = Fastify();
 *
 * // Parse body as raw string for the webhook route
 * app.addContentTypeParser(
 *   "application/json",
 *   { parseAs: "string" },
 *   (_req, body, done) => done(null, body),
 * );
 *
 * app.post("/webhooks/nexa", createWebhookHandler({
 *   webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
 *   onFileComplete: async (event) => {
 *     await syncRecords(event.fileId, event.userId);
 *   },
 *   onPaymentComplete: async (event) => {
 *     await recordPayment(event.reference, event.amount);
 *   },
 * }));
 *
 * await app.listen({ port: 3000 });
 */
export function createWebhookHandler(config: WebhookHandlerConfig) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // With addContentTypeParser parseAs: "string", body is already a string.
      // If the default JSON parser ran first, re-serialising would produce a
      // different byte sequence and break HMAC verification. Throw instead.
      if (typeof request.body !== "string") {
        return reply.status(400).send({
          error: "Webhook body must be a raw string. Add addContentTypeParser({ parseAs: 'string' }) for this route.",
        });
      }
      const rawBody = request.body;

      const rawSig = request.headers["x-nexa-signature"];
      const rawTs = request.headers["x-nexa-timestamp"];
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

      return reply.status(200).send({ received: true });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status ?? 500;
      const message = (err as Error).message ?? "Webhook error";
      return reply.status(status).send({ error: message });
    }
  };
}
