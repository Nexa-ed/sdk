import type { ConvexHttpClient } from "convex/browser";
import type { WebhookPaymentEvent, WebhookFileCompleteEvent } from "@nexa-ed/sdk";

/**
 * The shape `api.nexa` must expose for the payment handler to work.
 * TypeScript will error at the call site if the mounted mutations don't match.
 */
interface NexaPaymentApi {
  nexa: {
    upsertPaymentFromNexa: (args: { payload: PaymentPayload }) => Promise<unknown>;
  };
}

interface PaymentPayload {
  reference: string;
  tenantId: string;
  customerEmail: string;
  amount: number;
  status: "pending" | "success" | "failed" | "abandoned";
  amountPaid?: number;
  fees?: number;
  platformFee?: number;
  netAmount?: number;
  paidAt?: string;
  channel?: string;
  failureReason?: string;
  createdAt: number;
  updatedAt: number;
}

interface NexaFileApi {
  nexa: {
    upsertFileResultFromNexa: (args: {
      fileId: string;
      userId: string;
      tenantId: string;
      status?: "completed" | "failed";
    }) => Promise<unknown>;
  };
}

/**
 * Creates an `onPaymentComplete` callback that persists every
 * `payment.completed` webhook to the `paymentTransactions` Convex table.
 *
 * @param convex - A `ConvexHttpClient` instance
 * @param api    - Your Convex `api` object (from `convex/_generated/api`)
 *
 * @example
 * ```ts
 * import { createPaymentCompleteHandler } from "@nexa-ed/convex/handlers";
 * import { ConvexHttpClient } from "convex/browser";
 * import { api } from "@/convex/_generated/api";
 *
 * const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
 *
 * export const nexa = createNexa({
 *   // ...
 *   onPaymentComplete: createPaymentCompleteHandler(convex, api),
 * });
 * ```
 */
export function createPaymentCompleteHandler(
  convex: ConvexHttpClient,
  api: NexaPaymentApi,
): (event: WebhookPaymentEvent) => Promise<void> {
  return async (event) => {
    const payload: PaymentPayload = {
      reference: event.reference,
      tenantId: event.tenantId,
      customerEmail: event.customerEmail,
      amount: event.amount,
      status: event.status,
      amountPaid: event.amountPaid,
      fees: event.fees,
      platformFee: event.platformFee,
      netAmount: event.netAmount,
      paidAt: event.paidAt,
      channel: event.channel,
      failureReason: event.failureReason,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };

    await convex.mutation(api.nexa.upsertPaymentFromNexa as any, { payload });
  };
}

/**
 * Creates an `onFileComplete` callback that records every `file.completed`
 * webhook to the `nexaFileResults` Convex table.
 *
 * @param convex - A `ConvexHttpClient` instance
 * @param api    - Your Convex `api` object (from `convex/_generated/api`)
 *
 * @example
 * ```ts
 * import { createFileCompleteHandler } from "@nexa-ed/convex/handlers";
 *
 * export const nexa = createNexa({
 *   // ...
 *   onFileComplete: createFileCompleteHandler(convex, api),
 * });
 * ```
 */
export function createFileCompleteHandler(
  convex: ConvexHttpClient,
  api: NexaFileApi,
): (event: WebhookFileCompleteEvent) => Promise<void> {
  return async (event) => {
    await convex.mutation(api.nexa.upsertFileResultFromNexa as any, {
      fileId: event.fileId,
      userId: event.userId,
      tenantId: event.tenantId,
      status: "completed" as const,
    });
  };
}
