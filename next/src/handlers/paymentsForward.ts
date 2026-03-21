import type { NexaInstance } from "../types";
import type { WebhookPaymentEvent } from "@nexa-ed/sdk";

/**
 * Payment forward handler for `POST /api/nexa/payments/forward`.
 *
 * Receives payment completion events forwarded by the Nexa platform.
 * Verifies the request using Bearer token + HMAC-SHA256 (signed with
 * the tenant API key), then dispatches to `onPaymentComplete`.
 */
export async function handlePaymentsForward(
  request: Request,
  instance: NexaInstance,
): Promise<Response> {
  // ── Bearer token check ─────────────────────────────────────────────────────
  const auth = request.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token !== instance._config.apiKey) {
    return new Response(
      JSON.stringify({ success: false, message: "Unauthorized" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  // ── Timestamp + signature headers ─────────────────────────────────────────
  const timestamp = request.headers.get("x-timestamp") ?? "";
  const signature = request.headers.get("x-signature") ?? "";
  if (!timestamp || !signature) {
    return new Response(
      JSON.stringify({ success: false, message: "Missing signature headers (x-timestamp, x-signature)" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Replay protection — reject events older than 5 minutes
  const tsNum = Number(timestamp);
  if (!Number.isFinite(tsNum) || Math.abs(Date.now() - tsNum) > 5 * 60 * 1000) {
    return new Response(
      JSON.stringify({ success: false, message: "Stale or invalid timestamp" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // ── Parse body ─────────────────────────────────────────────────────────────
  let payload: Record<string, unknown>;
  try {
    payload = await request.json() as Record<string, unknown>;
  } catch {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid JSON body" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // ── HMAC verification ─────────────────────────────────────────────────────
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(instance._config.apiKey),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(JSON.stringify(payload) + timestamp),
  );
  const computed = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  if (computed !== signature) {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid signature" }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  // ── Validate required fields ───────────────────────────────────────────────
  const p = payload as Partial<WebhookPaymentEvent>;
  const { reference, tenantId, status, amount, customerEmail } = p;
  if (!reference || !tenantId || !status || amount == null || !customerEmail) {
    return new Response(
      JSON.stringify({ success: false, message: "Invalid payload — missing required fields" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Derive createdAt/updatedAt — Nexa forwards them in the payload when available,
  // falling back to the webhook delivery timestamp so the type is always satisfied.
  const now = Number.isFinite(Number(timestamp)) ? Number(timestamp) : Date.now();
  const createdAt = typeof p.createdAt === "number" ? p.createdAt : now;
  const updatedAt = typeof p.updatedAt === "number" ? p.updatedAt : now;

  // ── Dispatch to user callback ──────────────────────────────────────────────
  if (instance._onPaymentComplete) {
    try {
      await instance._onPaymentComplete({
        ...payload,
        event: "payment.completed",
        reference,
        tenantId,
        status,
        amount: Number(amount),
        customerEmail,
        timestamp,
        createdAt,
        updatedAt,
      } as WebhookPaymentEvent);
    } catch (err) {
      console.error("[nexa-ed/payments-forward] Error in onPaymentComplete callback:", err);
      return new Response(
        JSON.stringify({ success: false, message: "Internal handler error" }),
        { status: 500, headers: { "content-type": "application/json" } },
      );
    }
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { "content-type": "application/json" } },
  );
}
