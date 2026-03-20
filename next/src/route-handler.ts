import { handleProgress } from "./handlers/progress";
import { handleRpc } from "./handlers/rpc";
import { handleWebhook } from "./handlers/webhook";
import type { NexaInstance } from "./types";

interface RouteContext {
  params: Promise<{ nexaed: string[] }>;
}

/**
 * Create Next.js App Router route handlers that power the entire Nexa
 * integration from a single catch-all route.
 *
 * Mount at `app/api/nexa/[...nexaed]/route.ts`.
 *
 * Routes handled:
 *   GET  /api/nexa/progress/:fileId   → SSE progress stream proxy
 *   GET  /api/nexa/rpc/...path        → oRPC data query proxy
 *   POST /api/nexa/rpc/...path        → oRPC mutation proxy
 *   POST /api/nexa/webhook            → Signed webhook receiver
 *
 * @example
 * // app/api/nexa/[...nexaed]/route.ts
 * import { createRouteHandler } from "@nexa-ed/next";
 * import { nexa } from "@/lib/nexa";
 *
 * export const { GET, POST } = createRouteHandler({ client: nexa });
 */
export function createRouteHandler(options: { client: NexaInstance }) {
  const { client } = options;

  async function GET(request: Request, context: RouteContext) {
    const { nexaed } = await context.params;
    const [segment, ...rest] = nexaed ?? [];

    if (segment === "progress") {
      const fileId = rest[0];
      return handleProgress(request, fileId, client);
    }

    if (segment === "rpc") {
      return handleRpc(request, rest, client);
    }

    return new Response("Not found", { status: 404 });
  }

  async function POST(request: Request, context: RouteContext) {
    const { nexaed } = await context.params;
    const [segment, ...rest] = nexaed ?? [];

    if (segment === "webhook") {
      return handleWebhook(request, client);
    }

    if (segment === "rpc") {
      return handleRpc(request, rest, client);
    }

    return new Response("Not found", { status: 404 });
  }

  return { GET, POST };
}
