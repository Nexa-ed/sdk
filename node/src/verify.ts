import { NexaError } from "@nexa-ed/sdk";

/**
 * Verify a Nexa webhook payload from raw string inputs.
 *
 * This is the low-level verifier — it takes the pre-read body string and
 * the raw header values so it works with any HTTP framework.
 *
 * For framework-specific helpers that handle body reading automatically,
 * import from `@nexa-ed/node/express`, `@nexa-ed/node/hono`, or
 * `@nexa-ed/node/fastify`.
 *
 * Uses the Web Crypto API (available in Node.js 18+) for timing-safe
 * HMAC-SHA256 verification.
 *
 * @throws {NexaError} 401 — missing or invalid signature
 * @throws {NexaError} 400 — event too old (replay protection) or malformed JSON
 */
export async function verifyWebhookPayload<T = unknown>(
  rawBody: string,
  signature: string | null | undefined,
  timestamp: string | null | undefined,
  webhookSecret: string,
  options?: { maxAgeSeconds?: number },
): Promise<T> {
  const maxAge = options?.maxAgeSeconds ?? 300;

  if (!signature || !timestamp) {
    throw new NexaError(
      "Missing webhook signature headers (x-nexa-signature, x-nexa-timestamp)",
      401,
      "MISSING_SIGNATURE",
    );
  }

  // Normalise timestamp: values > 1e12 are millisecond timestamps
  const rawTime = parseInt(timestamp, 10);
  const eventTime = rawTime > 1e12 ? Math.floor(rawTime / 1000) : rawTime;
  const now = Math.floor(Date.now() / 1000);

  if (Math.abs(now - eventTime) > maxAge) {
    throw new NexaError(
      `Webhook event is too old (${Math.abs(now - eventTime)}s). Max allowed: ${maxAge}s.`,
      400,
      "REPLAY_DETECTED",
    );
  }

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
      "Webhook signature verification failed. Check your webhookSecret.",
      401,
      "INVALID_SIGNATURE",
    );
  }

  try {
    return JSON.parse(rawBody) as T;
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
