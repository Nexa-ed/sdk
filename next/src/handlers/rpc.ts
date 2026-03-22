import type { NexaInstance } from "../types";

/**
 * oRPC proxy handler for `/api/nexa/rpc/[...path]`.
 *
 * Forwards the request to Nexa's `/api/rpc/` endpoint, injecting the
 * tenant API key and current user ID as headers. This keeps both secrets
 * server-side — client components never see them.
 *
 * The path segments after `rpc/` are joined and forwarded verbatim, e.g.:
 *   /api/nexa/rpc/documents/getUserDocuments
 *   → https://nexa-ed.com/api/rpc/documents/getUserDocuments
 */
export async function handleRpc(
  request: Request,
  pathSegments: string[],
  instance: NexaInstance,
): Promise<Response> {
  let userId: string;
  try {
    const user = await instance._getUser(request);
    userId = user.userId;
  } catch (err) {
    console.error("[nexa-ed/rpc] getUser threw:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: { code: "UNAUTHORIZED", message } }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const procedurePath = pathSegments.join("/");
  const upstreamUrl = `${instance._config.baseUrl}/api/rpc/${procedurePath}`;

  // Forward the request body and method intact
  const body = request.method !== "GET" ? await request.text() : undefined;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: request.method,
      headers: {
        "content-type": "application/json",
        "x-api-key": instance._config.apiKey,
        "x-user-id": userId,
      },
      body,
      signal: request.signal,
    });
  } catch (err: any) {
    // Client navigated away or cancelled the request — not an error worth logging
    if (
      request.signal?.aborted ||
      err?.name === "AbortError" ||
      err?.name === "ResponseAborted"
    ) {
      return new Response(null, { status: 499 });
    }
    console.error(`[nexa-ed/rpc] upstream fetch failed for ${procedurePath}:`, err);
    return new Response(
      JSON.stringify({ error: { code: "INTERNAL_SERVER_ERROR", message: "Upstream unreachable" } }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const responseBody = await upstream.text();

  if (!upstream.ok) {
    console.error(
      `[nexa-ed/rpc] upstream ${procedurePath} returned ${upstream.status}:`,
      responseBody.slice(0, 500),
    );
  }

  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
    },
  });
}
