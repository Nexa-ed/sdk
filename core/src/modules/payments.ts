import { nexaFetch } from "../http";
import type { ResolvedNexaConfig } from "../config";
import type {
  PaymentInitializeOptions,
  PaymentInitializeResult,
  PaymentVerifyResult,
  PaymentConfig,
  PaymentSyncResult,
  PaymentStatsResponse,
  PaymentTransaction,
} from "../types";

export class PaymentsModule {
  constructor(private readonly config: ResolvedNexaConfig) {}

  /**
   * Initialize a payment and receive a Paystack authorization URL.
   *
   * @example
   * const { paymentUrl, reference } = await nexa.payments.initialize({
   *   email: "student@school.edu",
   *   amount: 5000_00, // 5,000 NGN in kobo
   *   metadata: { source: "enrollment", studentId: "stu_123" },
   *   callbackUrl: "https://myschool.com/payment/callback",
   * });
   * redirect(paymentUrl);
   */
  async initialize(
    options: PaymentInitializeOptions,
  ): Promise<PaymentInitializeResult> {
    return nexaFetch<PaymentInitializeResult>(
      this.config,
      "/api/payments/initialize",
      { method: "POST", body: options },
    );
  }

  /**
   * Verify a payment by its Paystack or Nexa reference.
   *
   * @example
   * const result = await nexa.payments.verify(reference);
   * if (result.transaction?.status === "success") {
   *   // payment confirmed
   * }
   */
  async verify(reference: string): Promise<PaymentVerifyResult> {
    return nexaFetch<PaymentVerifyResult>(
      this.config,
      `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
    );
  }

  /**
   * Pull a single transaction from Nexa into your tenant database.
   *
   * Useful after a successful verification to ensure the tenant DB is in
   * sync even before Nexa pushes the `payment.completed` webhook.
   *
   * @example
   * const sync = await nexa.payments.sync(nexaReference, tenantId);
   * if (sync.success && sync.payload) {
   *   await convex.mutation(api.payments.upsertFromNexa, { payload: sync.payload });
   * }
   */
  async sync(
    reference: string,
    tenantId: string,
  ): Promise<PaymentSyncResult> {
    return nexaFetch<PaymentSyncResult>(
      this.config,
      `/api/payments/sync?reference=${encodeURIComponent(reference)}&tenantId=${encodeURIComponent(tenantId)}`,
    );
  }

  /**
   * Get the payment configuration for this tenant (public key, mode, branding).
   *
   * @example
   * const config = await nexa.payments.getConfig();
   * console.log(config.mode); // "test" | "live"
   */
  async getConfig(): Promise<PaymentConfig> {
    const res = await nexaFetch<{ success: boolean; config: PaymentConfig } | PaymentConfig>(
      this.config,
      "/api/payments/config",
    );
    // Nexa may return { success, config } or the config directly
    return (res as { config: PaymentConfig }).config ?? (res as PaymentConfig);
  }

  /**
   * Check the status of a payment by reference (lightweight polling alternative to verify).
   */
  async getStatus(reference: string): Promise<PaymentTransaction> {
    return nexaFetch<PaymentTransaction>(
      this.config,
      `/api/payments/status?reference=${encodeURIComponent(reference)}`,
    );
  }

  /**
   * List payment transactions for this tenant.
   */
  async getTransactions(): Promise<{ transactions: PaymentTransaction[] }> {
    return nexaFetch(this.config, "/api/payments/transactions");
  }

  /**
   * Get aggregated payment stats (total revenue, counts by status).
   */
  async getStats(): Promise<PaymentStatsResponse> {
    return nexaFetch(this.config, "/api/payments/stats");
  }
}
