import type { NexaInstance } from "../types";

/**
 * Upload + process handler for `POST /api/nexa/upload`.
 *
 * Accepts a `multipart/form-data` body (the PDF file) and forwards it to
 * Nexa's tenant upload-and-process endpoint with the API key and user ID
 * injected server-side, keeping secrets out of the browser bundle.
 *
 * Returns `{ success: true, fileId: string, jobId?: string }` from Nexa.
 */
export async function handleUpload(
  request: Request,
  instance: NexaInstance,
): Promise<Response> {
  let userId: string;
  try {
    const user = await instance._getUser(request);
    userId = user.userId;
  } catch (err) {
    console.error("[nexa-ed/upload] getUser threw:", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Unauthorized", detail: message }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  // Forward the raw FormData body to Nexa's combined upload+process endpoint.
  // We intentionally do NOT call request.formData() here — re-serialising a
  // large PDF through JavaScript memory would be needlessly expensive.  Instead
  // we pipe the raw body with the Content-Type header preserved.
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.startsWith("multipart/form-data")) {
    return new Response(
      JSON.stringify({ error: "Expected multipart/form-data" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const upstreamUrl = `${instance._config.baseUrl}/api/file-processing/tenant-upload-and-process`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": contentType,
        "x-api-key": instance._config.apiKey,
        "x-user-id": userId,
      },
      body: request.body,
      // @ts-expect-error — Node.js fetch supports duplex for streaming bodies
      duplex: "half",
      signal: request.signal,
    });
  } catch (err) {
    console.error("[nexa-ed/upload] Upstream fetch failed:", err);
    return new Response(
      JSON.stringify({ error: "Upload request failed" }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  const body = await upstream.text();
  return new Response(body, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
