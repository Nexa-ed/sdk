/**
 * Proxy a Nexa SSE progress stream for a file.
 *
 * Returns a `ReadableStream` you can pipe directly to your HTTP response.
 * Works with any framework that supports streaming responses
 * (Express 5, Fastify, Hono, raw Node.js http, etc.).
 *
 * @example
 * // Express 5
 * app.get("/progress/:fileId", async (req, res) => {
 *   res.setHeader("Content-Type", "text/event-stream");
 *   res.setHeader("Cache-Control", "no-cache");
 *   const stream = await proxyProgressStream(req.params.fileId, {
 *     apiKey: process.env.NEXA_API_KEY!,
 *   });
 *   Readable.fromWeb(stream).pipe(res);
 * });
 *
 * @example
 * // Hono
 * app.get("/progress/:fileId", async (c) => {
 *   const stream = await proxyProgressStream(c.req.param("fileId"), {
 *     apiKey: process.env.NEXA_API_KEY!,
 *   });
 *   return new Response(stream, {
 *     headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
 *   });
 * });
 */
export async function proxyProgressStream(
  fileId: string,
  config: { apiKey: string; baseUrl?: string },
): Promise<ReadableStream<Uint8Array>> {
  if (!fileId) {
    throw new Error("[nexa-ed] proxyProgressStream: fileId is required");
  }

  const baseUrl = config.baseUrl?.replace(/\/+$/, "") ?? "https://nexa-ed.com";
  const url = `${baseUrl}/api/file-processing/progress/${encodeURIComponent(fileId)}`;

  const upstream = await fetch(url, {
    headers: {
      "x-api-key": config.apiKey,
      Accept: "text/event-stream",
    },
  });

  if (!upstream.ok) {
    throw new Error(
      `[nexa-ed] Nexa progress stream returned ${upstream.status}: ${upstream.statusText}`,
    );
  }

  if (!upstream.body) {
    throw new Error("[nexa-ed] Nexa progress stream returned an empty body");
  }

  return upstream.body;
}
