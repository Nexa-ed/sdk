import { nexaFetch } from "../http";
import type { ResolvedNexaConfig } from "../config";
import type {
  PaymentInitializeOptions,
  PaymentInitializeResult,
  PaymentStatus,
  PaymentStatsResponse,
  PaymentTransaction,
} from "../types";

export class PaymentsModule {
  constructor(private readonly config: ResolvedNexaConfig) {}

  /**
   * Initialize a payment and receive a Paystack payment URL.
   *
   * @example
   * const { paymentUrl } = await nexa.payments.initialize({
   *   email: "student@school.edu",
   *   amount: 5000_00, // 5,000 NGN in kobo
   *   netAmount: 4900_00,
   *   metadata: { studentId: "stu_123", term: "2024-1" },
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
   * Verify a payment by its Paystack reference.
   */
  async verify(
    reference: string,
  ): Promise<{ status: PaymentStatus; transaction: PaymentTransaction }> {
    return nexaFetch(
      this.config,
      `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
    );
  }

  /**
   * Get the payment configuration for this tenant.
   */
  async getConfig(): Promise<Record<string, unknown>> {
    return nexaFetch(this.config, "/api/payments/config");
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
