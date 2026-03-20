import { nexaFetch } from "../http";
import type { ResolvedNexaConfig } from "../config";
import type { GetServicesResponse, TenantService } from "../types";

export class ServicesModule {
  constructor(private readonly config: ResolvedNexaConfig) {}

  /**
   * List all services enabled for this tenant, including their subscription
   * tier, available features, and configuration.
   *
   * @example
   * const { services } = await nexa.services.list();
   * const ocr = services.find(s => s.serviceId === "ocr");
   */
  async list(): Promise<GetServicesResponse> {
    return nexaFetch<GetServicesResponse>(this.config, "/api/tenant/services");
  }

  /**
   * Get details for a specific service.
   */
  async get(serviceId: string): Promise<TenantService> {
    return nexaFetch<TenantService>(
      this.config,
      `/api/tenant/services/${encodeURIComponent(serviceId)}`,
    );
  }

  /**
   * Get usage metrics for a specific service.
   */
  async getUsage(serviceId: string): Promise<Record<string, unknown>> {
    return nexaFetch(
      this.config,
      `/api/tenant/services/${encodeURIComponent(serviceId)}/usage`,
    );
  }
}
