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
  } catch {
    return new Response(
      JSON.stringify({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  const procedurePath = pathSegments.join("/");
  const upstreamUrl = `${instance._config.baseUrl}/api/rpc/${procedurePath}`;

  // Forward the request body and method intact
  const body = request.method !== "GET" ? await request.text() : undefined;

  const upstream = await fetch(upstreamUrl, {
    method: request.method,
    headers: {
      "content-type": "application/json",
      "x-api-key": instance._config.apiKey,
      "x-user-id": userId,
    },
    body,
    signal: request.signal,
  });

  const responseBody = await upstream.text();

  return new Response(responseBody, {
    status: upstream.status,
    headers: {
      "content-type": "application/json",
    },
  });
}
