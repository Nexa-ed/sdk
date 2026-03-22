import { NexaError } from "@nexa-ed/sdk";
import type { NexaInstance } from "../types";
import type { WebhookEvent } from "@nexa-ed/sdk";

/**
 * Webhook receiver handler for `POST /api/nexa/webhook`.
 *
 * Verifies the HMAC-SHA256 signature, parses the event, and dispatches
 * to the appropriate user-defined callback (e.g. `onFileComplete`).
 */
export async function handleWebhook(
  request: Request,
  instance: NexaInstance,
): Promise<Response> {
  const signature = request.headers.get("x-nexa-signature");
  const timestamp = request.headers.get("x-nexa-timestamp");

  if (!signature || !timestamp) {
    return new Response(
      JSON.stringify({ error: "Missing webhook signature headers (x-nexa-signature, x-nexa-timestamp)" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  let event: WebhookEvent;
  try {
    event = await verifyAndParse(
      signature,
      timestamp,
      request,
      instance._config.webhookSecret,
    );
  } catch (err: unknown) {
    const message =
      err instanceof NexaError ? err.message : "Webhook signature verification failed";
    const status = err instanceof NexaError ? err.status : 401;
    return new Response(
      JSON.stringify({ error: message }),
      { status, headers: { "content-type": "application/json" } },
    );
  }

  // Dispatch to user-defined callbacks
  try {
    if (event.event === "file.completed" && instance._onFileComplete) {
      await instance._onFileComplete(event);
    }
  } catch (err) {
    // Don't expose internal errors to Nexa, but log them for the developer
    console.error("[nexa-ed] Error in onFileComplete callback:", err);
    return new Response(
      JSON.stringify({ error: "Internal handler error" }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
}

async function verifyAndParse(
  signature: string,
  timestamp: string,
  request: Request,
  webhookSecret: string,
): Promise<WebhookEvent> {
  // Replay protection — reject events older than 5 minutes.
  // Normalise to seconds: the platform sends Date.now() (ms), but some
  // senders may already send seconds. Any value > 1e12 is treated as ms.
  const rawTime = parseInt(timestamp, 10);
  const eventTime = rawTime > 1e12 ? Math.floor(rawTime / 1000) : rawTime;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - eventTime) > 300) {
    throw new NexaError(
      `Webhook event is too old (${Math.abs(now - eventTime)}s). Possible replay attack.`,
      400,
      "REPLAY_DETECTED",
    );
  }

  const rawBody = await request.text();

  // HMAC-SHA256 verification using the Web Crypto API (timing-safe)
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(webhookSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const sigBuffer = hexToBuffer(signature);
  const message = encoder.encode(rawBody + timestamp);
  const valid = await crypto.subtle.verify("HMAC", key, sigBuffer, message);

  if (!valid) {
    throw new NexaError(
      "Webhook signature verification failed. Check your NEXA_WEBHOOK_SECRET.",
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
