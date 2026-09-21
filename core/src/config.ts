import type { EmailTier } from "./types";

/**
 * Email configuration — set once per tenant app in `createNexa()`.
 * All `nexa.email.*` calls use these values automatically, so you never
 * need to pass `tier` or `domain` on individual method calls.
 */
export interface NexaEmailConfig {
  /**
   * Which email infrastructure tier your school is on.
   *
   * | Tier | Provider | Domain |
   * |---|---|---|
   * | `tier-1-nexa`     | Nexa-hosted Stalwart        | `school.nexa-ed.com` |
   * | `tier-2-stalwart` | Stalwart, own domain        | Your domain on Stalwart |
   * | `tier-3-google`   | Google Workspace            | Your own domain |
   */
  tier: EmailTier;

  /**
   * The email domain for student accounts.
   *
   * - Tier 1: `loretto.nexa-ed.com` (Nexa provides the subdomain — pass your school slug)
   * - Tier 2: `loretto.edu.ng` (your school's own domain on Stalwart)
   * - Tier 3: `loretto.edu.ng` (your school's own domain on Google Workspace)
   */
  domain: string;
}

export interface NexaConfig {
  /**
   * Your Nexa API key — found in the Nexa dashboard under **API key**.
   */
  apiKey: string;

  /**
   * Webhook signing secret — used to verify the authenticity of incoming
   * webhook payloads from Nexa.
   *
   * Today Nexa signs every webhook with your **API key** (HMAC-SHA256), so
   * set this to the same value as `apiKey`. There is no separate secret to
   * generate yet. Keep them in sync when you rotate the API key.
   */
  webhookSecret: string;

  /**
   * Optional base URL override.
   *
   * Defaults to `https://nexa-ed.com`.
   * Only set this when pointing at a local or staging Nexa instance
   * (e.g. `http://localhost:3000` during platform development).
   *
   * External tenant apps should leave this unset — they always hit production.
   */
  baseUrl?: string;

  /**
   * Email provisioning configuration.
   *
   * Required if you use `nexa.email.*` methods.
   * Set this once and all email calls work identically regardless of tier.
   *
   * @example
   * email: {
   *   tier: "tier-3-google",
   *   domain: "loretto.edu.ng",
   * }
   */
  email?: NexaEmailConfig;
}

export interface ResolvedNexaConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
  email?: NexaEmailConfig;
}

export function resolveConfig(config: NexaConfig): ResolvedNexaConfig {
  return {
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret,
    // Strip trailing slash so path concatenation is always consistent
    baseUrl: config.baseUrl?.replace(/\/+$/, "") ?? "https://nexa-ed.com",
    email: config.email,
  };
}

/**
 * Validates that the resolved config has the required fields.
 * Called lazily at request time (not at construction) so that
 * Next.js build-time module evaluation does not throw when env
 * vars are absent.
 */
export function assertConfig(config: ResolvedNexaConfig): void {
  if (!config.apiKey) {
    throw new Error("[nexa-ed] apiKey is required. Get yours from the Nexa dashboard.");
  }
}
