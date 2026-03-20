import type { NexaInstance } from "../types";

/**
 * SSE proxy handler for `/api/nexa/progress/[fileId]`.
 *
 * The browser's native `EventSource` API cannot attach custom headers,
 * so this server-side proxy injects the API key and user ID before
 * forwarding the stream from Nexa.
 */
export async function handleProgress(
  request: Request,
  fileId: string,
  instance: NexaInstance,
): Promise<Response> {
  if (!fileId) {
    return new Response("fileId is required", { status: 400 });
  }

  let userId: string;
  try {
    const user = await instance._getUser(request);
    userId = user.userId;
  } catch {
    return new Response("Unauthorized", { status: 401 });
  }

  const upstreamUrl = `${instance._config.baseUrl}/api/file-processing/progress/${fileId}`;

  const upstream = await fetch(upstreamUrl, {
    headers: {
      "x-api-key": instance._config.apiKey,
      "x-user-id": userId,
      accept: "text/event-stream",
      "cache-control": "no-cache",
    },
    // Propagate client abort
    signal: request.signal,
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(
      `Failed to connect to Nexa progress stream: ${upstream.statusText}`,
      { status: upstream.status },
    );
  }

  // Pipe the upstream SSE stream directly to the client
  return new Response(upstream.body, {
    headers: {
      "content-type": "text/event-stream",
      "cache-control": "no-cache, no-transform",
      connection: "keep-alive",
      // Allow browser to read stream cross-origin if needed
      "access-control-allow-origin": "*",
    },
  });
}
