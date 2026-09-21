import type {
  WebhookPaymentEvent,
  WebhookFileCompleteEvent,
  WebhookEmailCreatedEvent,
  WebhookEmailStatusChangedEvent,
} from "@nexa-ed/sdk";

type StudentEmailWebhookEvent = WebhookEmailCreatedEvent | WebhookEmailStatusChangedEvent;

/**
 * Minimal structural shape of a Convex client, satisfied by `ConvexHttpClient`
 * from any `convex` package version. Avoids a nominal dependency on `convex/browser`'s
 * class type, which otherwise breaks the moment a consuming app's `convex` version
 * diverges from whatever version this package was last built against.
 */
interface ConvexMutationClient {
  mutation: (reference: any, args: any) => Promise<unknown>;
}

/**
 * Accepts any Convex `api` object — the codegen'd tree from
 * `convex/_generated/api`, `anyApi`, or even a stale/empty one generated
 * before `convex/nexa.ts` was mounted.
 *
 * A strict structural type here (e.g. `{ nexa: { upsertPaymentFromNexa: (args) => Promise } }`)
 * can never match the real codegen output, because Convex function references
 * are branded string/object types, not callables — every consumer would be
 * forced into `api as any`. Instead we accept the tree loosely and validate
 * the exact mutation reference at handler creation time via
 * {@link requireNexaFunction}, which fails with actionable steps.
 */
export type NexaConvexApi = Record<string, any>;

function requireNexaFunction(api: NexaConvexApi, mutationName: string): unknown {
  const reference = api?.nexa?.[mutationName];
  if (reference === undefined) {
    throw new Error(
      `[@nexa-ed/convex] api.nexa.${mutationName} not found on the Convex api object.\n` +
        `Fix:\n` +
        `  1. Create convex/nexa.ts in your app:\n` +
        `       export { ${mutationName} } from "@nexa-ed/convex/mutations";\n` +
        `  2. Run \`npx convex dev\` (or \`npx convex codegen\`) so convex/_generated/api picks it up.\n` +
        `  3. Import api from your OWN generated tree: \`import { api } from "<your-app>/convex/_generated/api"\` — not from this package.`,
    );
  }
  return reference;
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

/**
 * Creates a handler that persists every `email.created` or `email.status_changed`
 * webhook to the `studentEmails` Convex table.
 *
 * There's no `createNexa()` callback for email events, so unlike the payment/file
 * handlers this isn't wired in automatically — call it yourself from a custom
 * webhook route after `nexa.webhooks.verify(request)`.
 *
 * @param convex - A `ConvexHttpClient` instance
 * @param api    - Your Convex `api` object from your app's `convex/_generated/api`
 *                 (requires `convex/nexa.ts` re-exporting `upsertStudentEmailFromNexa`,
 *                 then `npx convex dev` to regenerate)
 *
 * @example
 * ```ts
 * // convex/nexa.ts — mount the mutation in YOUR app's convex dir
 * export { upsertStudentEmailFromNexa } from "@nexa-ed/convex/mutations";
 *
 * // app/route.ts
 * import { createStudentEmailHandler } from "@nexa-ed/convex/handlers";
 * import { ConvexHttpClient } from "convex/browser";
 * import { api } from "@/convex/_generated/api";
 * import { nexa } from "@/lib/nexa";
 *
 * const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
 * const handleStudentEmail = createStudentEmailHandler(convex, api);
 *
 * export async function POST(request: Request) {
 *   const event = await nexa.webhooks.verify(request);
 *   if (event.event === "email.created" || event.event === "email.status_changed") {
 *     await handleStudentEmail(event);
 *   }
 *   return Response.json({ received: true });
 * }
 * ```
 */
export function createStudentEmailHandler(
  convex: ConvexMutationClient,
  api: NexaConvexApi,
): (event: StudentEmailWebhookEvent) => Promise<void> {
  const reference = requireNexaFunction(api, "upsertStudentEmailFromNexa");
  return async (event) => {
    await convex.mutation(reference, {
      payload: event,
    });
  };
}

/**
 * Creates an `onPaymentComplete` callback that persists every
 * `payment.completed` webhook to the `paymentTransactions` Convex table.
 *
 * @param convex - A `ConvexHttpClient` instance
 * @param api    - Your Convex `api` object from your app's `convex/_generated/api`
 *                 (requires `convex/nexa.ts` re-exporting `upsertPaymentFromNexa`,
 *                 then `npx convex dev` to regenerate)
 *
 * @example
 * ```ts
 * // convex/nexa.ts — mount the mutation in YOUR app's convex dir
 * export { upsertPaymentFromNexa } from "@nexa-ed/convex/mutations";
 *
 * // lib/nexa.ts
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
  convex: ConvexMutationClient,
  api: NexaConvexApi,
): (event: WebhookPaymentEvent) => Promise<void> {
  const reference = requireNexaFunction(api, "upsertPaymentFromNexa");
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

    await convex.mutation(reference, { payload });
  };
}

/**
 * Creates an `onFileComplete` callback that records every `file.completed`
 * webhook to the `nexaFileResults` Convex table.
 *
 * @param convex - A `ConvexHttpClient` instance
 * @param api    - Your Convex `api` object from your app's `convex/_generated/api`
 *                 (requires `convex/nexa.ts` re-exporting `upsertFileResultFromNexa`,
 *                 then `npx convex dev` to regenerate)
 *
 * @example
 * ```ts
 * // convex/nexa.ts — mount the mutation in YOUR app's convex dir
 * export { upsertFileResultFromNexa } from "@nexa-ed/convex/mutations";
 *
 * // lib/nexa.ts
 * import { createFileCompleteHandler } from "@nexa-ed/convex/handlers";
 *
 * export const nexa = createNexa({
 *   // ...
 *   onFileComplete: createFileCompleteHandler(convex, api),
 * });
 * ```
 */
export function createFileCompleteHandler(
  convex: ConvexMutationClient,
  api: NexaConvexApi,
): (event: WebhookFileCompleteEvent) => Promise<void> {
  const reference = requireNexaFunction(api, "upsertFileResultFromNexa");
  return async (event) => {
    await convex.mutation(reference, {
      fileId: event.fileId,
      userId: event.userId,
      tenantId: event.tenantId,
      status: "completed" as const,
    });
  };
}


