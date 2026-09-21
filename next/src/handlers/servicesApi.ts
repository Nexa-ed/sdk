import type { NexaInstance } from "../types";

/**
 * Services catalog API proxy handler.
 *
 * Proxies client-side service-catalog requests through the tenant's route
 * handler so the Nexa API key stays server-side. Unlike the payments proxy,
 * these upstream routes are path-parameterized rather than flat endpoint
 * names, so the subpath segments are forwarded positionally.
 *
 * Handled routes (all under /api/nexa/services/...):
 *   GET /api/nexa/services            → GET /api/tenant/services
 *   GET /api/nexa/services/:id        → GET /api/tenant/services/:id
 *   GET /api/nexa/services/:id/usage  → GET /api/tenant/services/:id/usage
 */
export async function handleServicesApi(
  request: Request,
  subpath: string[],
  instance: NexaInstance,
): Promise<Response> {
  const { baseUrl, apiKey } = instance._config;

  let upstreamPath: string;
  if (subpath.length === 0) {
    upstreamPath = "/api/tenant/services";
  } else if (subpath.length === 1) {
    upstreamPath = `/api/tenant/services/${encodeURIComponent(subpath[0])}`;
  } else if (subpath.length === 2 && subpath[1] === "usage") {
    upstreamPath = `/api/tenant/services/${encodeURIComponent(subpath[0])}/usage`;
  } else {
    return new Response("Not found", { status: 404 });
  }

  const incoming = new URL(request.url);
  const upstream = new URL(upstreamPath, baseUrl);

  incoming.searchParams.forEach((value, key) => {
    upstream.searchParams.set(key, value);
  });

  try {
    const upstreamResponse = await fetch(upstream.toString(), {
      method: "GET",
      headers: { "x-api-key": apiKey },
    });
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
    console.error("[nexa-ed/services-api] Upstream fetch failed:", err);
    return new Response(
      JSON.stringify({ success: false, message: "Services catalog unavailable" }),
      { status: 502, headers: { "Content-Type": "application/json" } },
    );
  }
}
