export interface NexaConfig {
  /**
   * Your Nexa API key — found in the Nexa dashboard under Settings → API Keys.
   */
  apiKey: string;

  /**
   * Webhook signing secret — used to verify the authenticity of incoming
   * webhook payloads from Nexa. Found in the Nexa dashboard under Webhooks.
   *
   * Keep this separate from your API key: the API key authenticates requests
   * you make TO Nexa, while the webhook secret verifies requests Nexa makes
   * TO you. Rotating one does not affect the other.
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
}

export interface ResolvedNexaConfig {
  apiKey: string;
  webhookSecret: string;
  baseUrl: string;
}

export function resolveConfig(config: NexaConfig): ResolvedNexaConfig {
  return {
    apiKey: config.apiKey,
    webhookSecret: config.webhookSecret,
    // Strip trailing slash so path concatenation is always consistent
    baseUrl: config.baseUrl?.replace(/\/+$/, "") ?? "https://nexa-ed.com",
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
