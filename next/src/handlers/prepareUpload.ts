import type { NexaInstance } from "../types";

/**
 * Prepare-upload handler for `POST /api/nexa/prepare`.
 *
 * Accepts a JSON body `{ name, size, type }` (no file bytes).
 * Calls Nexa's upload-token endpoint server-side (API key never leaves the server),
 * then returns `{ token, uploadUrl }` to the browser so it can upload the file
 * directly to Nexa — skipping the Loretto server entirely for the file transfer.
 */
export async function handlePrepareUpload(
  request: Request,
  instance: NexaInstance,
): Promise<Response> {
  let userId: string;
  try {
    const user = await instance._getUser(request);
    userId = user.userId;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return new Response(
      JSON.stringify({ error: "Unauthorized", detail: message }),
      { status: 401, headers: { "content-type": "application/json" } },
    );
  }

  let body: { name: string; size: number; type: string };
  try {
    const raw = await request.json() as unknown;
    if (
      typeof raw !== "object" ||
      raw === null ||
      typeof (raw as Record<string, unknown>).name !== "string" ||
      typeof (raw as Record<string, unknown>).size !== "number" ||
      typeof (raw as Record<string, unknown>).type !== "string"
    ) {
      return new Response(
        JSON.stringify({ error: "Expected JSON body: { name: string, size: number, type: string }" }),
        { status: 400, headers: { "content-type": "application/json" } },
      );
    }
    body = raw as { name: string; size: number; type: string };
  } catch {
    return new Response(
      JSON.stringify({ error: "Expected JSON body: { name, size, type }" }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const upstreamUrl = `${instance._config.baseUrl}/api/file-processing/upload-token`;

  let upstream: Response;
  try {
    upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": instance._config.apiKey,
        "x-user-id": userId,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    console.error("[nexa-ed/prepare-upload] Upstream fetch failed:", err);
    return new Response(
      JSON.stringify({ error: "Failed to request upload token" }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }

  let responseBody: string;
  try {
    responseBody = await upstream.text();
  } catch (err) {
    console.error("[nexa-ed/prepare-upload] Failed to read upstream response:", err);
    return new Response(
      JSON.stringify({ error: "Failed to read upload token response" }),
      { status: 502, headers: { "content-type": "application/json" } },
    );
  }
  return new Response(responseBody, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}
