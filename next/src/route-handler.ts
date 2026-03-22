import { handleProgress } from "./handlers/progress";
import { handleRpc } from "./handlers/rpc";
import { handleWebhook } from "./handlers/webhook";
import { handleUpload } from "./handlers/upload";
import { handlePrepareUpload } from "./handlers/prepareUpload";
import { handlePaymentsForward } from "./handlers/paymentsForward";
import { handlePaymentsApi } from "./handlers/paymentsApi";
import type { NexaInstance } from "./types";

interface RouteContext {
  params: Promise<{ nexaed: string[] }>;
}

/**
 * Create Next.js App Router route handlers that power the entire Nexa
 * integration from a single catch-all route.
 *
 * Mount at `app/api/nexa/[...nexaed]/route.ts` — that's the only file
 * you need. Everything else is handled automatically.
 *
 * Routes handled:
 *   GET  /api/nexa/progress/:fileId          → SSE progress stream proxy
 *   GET  /api/nexa/rpc/...path               → oRPC data query proxy
 *   POST /api/nexa/rpc/...path               → oRPC mutation proxy
 *   POST /api/nexa/prepare                   → Request short-lived upload token (no file body)
 *   POST /api/nexa/upload                    → File upload + process proxy (legacy)
 *   POST /api/nexa/webhook                   → File completion webhook
 *   POST /api/nexa/file-processing/forward   → File completion webhook (alias)
 *   POST /api/nexa/payments/forward          → Payment completion webhook
 *   GET  /api/nexa/payments/config           → Payment config proxy
 *   POST /api/nexa/payments/initialize       → Initialize payment proxy
 *   GET  /api/nexa/payments/status           → Payment status proxy
 *   GET  /api/nexa/payments/transactions     → Transactions list proxy
 *   GET  /api/nexa/payments/stats            → Payment stats proxy
 *
 * @example
 * ```ts
 * // app/api/nexa/[...nexaed]/route.ts  ← the only file you write
 * import { createRouteHandler } from "@nexa-ed/next";
 * import { nexa } from "../../../lib/nexa";
 *
 * export const { GET, POST } = createRouteHandler({ client: nexa });
 * ```
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

    // Payment API proxy for GET endpoints (config, status, transactions, stats)
    if (segment === "payments") {
      return handlePaymentsApi(request, rest, client);
    }

    return new Response("Not found", { status: 404 });
  }

  async function POST(request: Request, context: RouteContext) {
    const { nexaed } = await context.params;
    const [segment, ...rest] = nexaed ?? [];

    // File completion webhook — canonical path
    if (segment === "webhook") {
      return handleWebhook(request, client);
    }

    // File completion webhook — legacy path alias
    // (for tenants who had the Nexa webhook URL set to /api/nexa/file-processing/forward)
    if (segment === "file-processing" && rest[0] === "forward") {
      return handleWebhook(request, client);
    }

    // Payment forwarding webhook
    if (segment === "payments" && rest[0] === "forward") {
      return handlePaymentsForward(request, client);
    }

    // Payment API proxy (config, initialize, status, transactions, stats)
    if (segment === "payments") {
      return handlePaymentsApi(request, rest, client);
    }

    if (segment === "upload") {
      return handleUpload(request, client);
    }

    // Prepare upload: returns a short-lived token + uploadUrl so the browser
    // can POST the file directly to Nexa, bypassing Loretto's server.
    if (segment === "prepare") {
      return handlePrepareUpload(request, client);
    }

    if (segment === "rpc") {
      return handleRpc(request, rest, client);
    }

    return new Response("Not found", { status: 404 });
  }

  return { GET, POST };
}
