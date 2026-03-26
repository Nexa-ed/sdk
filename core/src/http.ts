import { NexaError } from "./error";
import { assertConfig } from "./config";
import type { ResolvedNexaConfig } from "./config";

interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  userId?: string;
  signal?: AbortSignal;
  headers?: Record<string, string>;
}

// Shape of an oRPC error response body
interface OrcpErrorBody {
  error?: { code?: string; message?: string };
  message?: string;
}

/**
 * Base fetch helper for Nexa REST endpoints.
 * Attaches the API key header and parses errors uniformly.
 */
export async function nexaFetch<T>(
  config: ResolvedNexaConfig,
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  assertConfig(config);
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-api-key": config.apiKey,
    ...options.headers,
  };

  if (options.userId) {
    headers["x-user-id"] = options.userId;
  }

  const res = await fetch(`${config.baseUrl}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as OrcpErrorBody;
    const message = err?.error?.message ?? err?.message ?? res.statusText;
    throw new NexaError(message, res.status, err?.error?.code);
  }

  return res.json() as Promise<T>;
}

/**
 * RPC call to the Nexa oRPC layer (`/api/rpc`).
 *
 * The oRPC `RPCHandler` on the server side:
 * - Expects POST with a JSON body (the procedure input)
 * - Returns 200 with the procedure output as a plain JSON body on success
 * - Returns 4xx/5xx with `{ error: { code, message } }` on failure
 *
 * Procedure paths use `/` as a separator for nested routers, e.g.
 * `documents/getUserDocuments` → POST /api/rpc/documents/getUserDocuments
 */
export async function nexaRpc<T>(
  config: ResolvedNexaConfig,
  procedure: string,
  input: unknown,
  userId: string,
  signal?: AbortSignal,
): Promise<T> {
  assertConfig(config);
  const res = await fetch(`${config.baseUrl}/api/rpc/${procedure}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "x-user-id": userId,
    },
    body: JSON.stringify(input ?? {}),
    signal,
  });

  // oRPC returns the output directly on success (no wrapper)
  if (res.ok) {
    return res.json() as Promise<T>;
  }

  const err = (await res.json().catch(() => ({}))) as OrcpErrorBody;
  const message = err?.error?.message ?? err?.message ?? res.statusText;
  throw new NexaError(message, res.status, err?.error?.code);
}
