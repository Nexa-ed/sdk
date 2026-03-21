import type { NexaInstance } from "../types";

/**
 * Payment API proxy handler.
 *
 * Proxies client-side payment API requests through the tenant's route handler
 * so the Nexa API key stays server-side.
 *
 * Handled routes (all under /api/nexa/payments/...):
 *   GET  payments/config       → GET  /api/payments/config
 *   POST payments/initialize   → POST /api/payments/initialize
 *   GET  payments/status       → GET  /api/payments/status
 *   GET  payments/transactions → GET  /api/payments/transactions
 *   GET  payments/stats        → GET  /api/payments/stats
 */
export async function handlePaymentsApi(
  request: Request,
  subpath: string[],
  instance: NexaInstance,
): Promise<Response> {
  const [endpoint] = subpath;
  const { baseUrl, apiKey } = instance._config;

  const endpointMap: Record<string, string> = {
    config: "/api/payments/config",
    initialize: "/api/payments/initialize",
    status: "/api/payments/status",
    transactions: "/api/payments/transactions",
    stats: "/api/payments/stats",
  };

  const upstreamPath = endpointMap[endpoint];
  if (!upstreamPath) {
    return new Response("Not found", { status: 404 });
  }

  const incoming = new URL(request.url);
  const upstream = new URL(upstreamPath, baseUrl);

  // Forward query parameters from the incoming request
  incoming.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  const fetchOptions: RequestInit = {
    method: request.method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
  };

  if (request.method === "POST" || request.method === "PUT" || request.method === "PATCH") {
    fetchOptions.body = await request.text();
  }

  try {
    const upstreamResponse = await fetch(upstream.toString(), fetchOptions);
    const body = await upstreamResponse.text();

    return new Response(body, {
      status: upstreamResponse.status,
      headers: {
        "Content-Type":
          upstreamResponse.headers.get("content-type") ?? "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[nexa-ed/payments-api] Upstream fetch failed:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Payment service unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
