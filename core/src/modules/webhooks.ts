import { NexaError } from "../error";
import type { ResolvedNexaConfig } from "../config";
import type { WebhookEvent } from "../types";

/**
 * Verify a Nexa webhook request and return the parsed event.
 *
 * Nexa signs every outgoing webhook with HMAC-SHA256 using your
 * `webhookSecret`. The signature covers `payload + timestamp` to prevent
 * replay attacks (events older than 5 minutes are rejected by default).
 *
 * Headers sent by Nexa:
 *   `x-nexa-signature`  — hex-encoded HMAC-SHA256
 *   `x-nexa-timestamp`  — Unix timestamp (seconds) when the event was signed
 *
 * @throws {NexaError} status 401 when signature is invalid or missing
 * @throws {NexaError} status 400 when the event is too old (replay protection)
 */
export async function verifyWebhook(
  config: ResolvedNexaConfig,
  request: Request,
  options?: { maxAgeSeconds?: number },
): Promise<WebhookEvent> {
  const maxAge = options?.maxAgeSeconds ?? 300; // 5 minutes default

  const signature = request.headers.get("x-nexa-signature");
  const timestamp = request.headers.get("x-nexa-timestamp");

  if (!signature || !timestamp) {
    throw new NexaError(
      "Missing webhook signature headers (x-nexa-signature, x-nexa-timestamp)",
      401,
      "MISSING_SIGNATURE",
    );
  }

  // Replay protection: reject events older than maxAge
  const eventTime = parseInt(timestamp, 10);
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - eventTime) > maxAge) {
    throw new NexaError(
      `Webhook event is too old (${Math.abs(now - eventTime)}s). Max allowed: ${maxAge}s.`,
      400,
      "REPLAY_DETECTED",
    );
  }

  const rawBody = await request.text();

  // Verify HMAC-SHA256 signature using the Web Crypto API (timing-safe)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(config.webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBuffer = hexToBuffer(signature);
  const message = encoder.encode(rawBody + timestamp);
  const valid = await crypto.subtle.verify("HMAC", key, sigBuffer, message);

  if (!valid) {
    throw new NexaError(
      "Webhook signature verification failed. Check your webhookSecret.",
      401,
      "INVALID_SIGNATURE",
    );
  }

  try {
    return JSON.parse(rawBody) as WebhookEvent;
  } catch {
    throw new NexaError("Webhook payload is not valid JSON", 400, "INVALID_PAYLOAD");
  }
}

function hexToBuffer(hex: string): ArrayBuffer {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes.buffer;
}

export class WebhooksModule {
  constructor(private readonly config: ResolvedNexaConfig) {}

  /**
   * Verify a Nexa webhook request and return the parsed, typed event.
   *
   * Call this inside your webhook route handler before processing the event.
   *
   * @example
   * // app/api/nexa/webhook/route.ts
   * export async function POST(req: Request) {
   *   const event = await nexa.webhooks.verify(req);
   *   if (event.event === "file.completed") {
   *     await syncRecords(event.fileId, event.userId);
   *   }
   *   return Response.json({ received: true });
   * }
   */
  verify(
    request: Request,
    options?: { maxAgeSeconds?: number },
  ): Promise<WebhookEvent> {
    return verifyWebhook(this.config, request, options);
  }
}
