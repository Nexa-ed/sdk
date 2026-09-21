export interface GetSchoolBrandingOptions {
  /** Nexa platform base URL. Defaults to `https://nexa-ed.com`. */
  baseUrl?: string;
  /** Next.js fetch cache revalidation window, in seconds, when running inside Next.js. */
  revalidateSeconds?: number;
  signal?: AbortSignal;
}

/**
 * Fetch a school's public branding config by subdomain.
 *
 * Unlike every other module, this call is unauthenticated — no API key is
 * required, since branding data must be readable before a tenant session
 * exists (e.g. from middleware, prior to auth). Safe to call from an edge
 * or Node.js middleware context.
 *
 * Returns the raw JSON response body as a string (not parsed), so callers
 * can forward it verbatim as a header value, or `JSON.parse` it themselves.
 *
 * @returns the raw response text, or `null` on any failure (network error
 *   or non-2xx status) — callers should treat `null` as "no branding
 *   available" and degrade gracefully rather than throwing.
 *
 * @example
 * // apps/loretto/src/middleware.ts
 * import { getSchoolBranding } from "@nexa-ed/next";
 *
 * const branding = await getSchoolBranding(subdomain, {
 *   baseUrl: process.env.NEXA_URL,
 *   revalidateSeconds: 300,
 * });
 * if (branding) reqHeaders.set("x-school-branding", branding);
 */
export async function getSchoolBranding(
  subdomain: string,
  options: GetSchoolBrandingOptions = {},
): Promise<string | null> {
  const baseUrl = options.baseUrl ?? "https://nexa-ed.com";

  try {
    const res = await fetch(
      `${baseUrl}/api/branding/${encodeURIComponent(subdomain)}`,
      {
        signal: options.signal,
        ...(options.revalidateSeconds !== undefined
          ? ({ next: { revalidate: options.revalidateSeconds } } as RequestInit)
          : {}),
      },
    );
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
