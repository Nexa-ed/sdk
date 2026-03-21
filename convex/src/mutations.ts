import { mutationGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Idempotent upsert for a payment transaction received via `payment.completed`
 * webhook or a smart-pull from `nexa.payments.sync()`.
 *
 * Safe to call multiple times for the same reference — creates on first call,
 * patches status and settlement fields on subsequent calls.
 *
 * Mount this in your `convex/nexa.ts`:
 * ```ts
 * export { upsertPaymentFromNexa } from "@nexa-ed/convex/mutations";
 * ```
 *
 * Then call it from your `onPaymentComplete` callback:
 * ```ts
 * await convex.mutation(api.nexa.upsertPaymentFromNexa, { payload: event });
 * ```
 */
export const upsertPaymentFromNexa = mutationGeneric({
  args: {
    payload: v.object({
      reference: v.string(),
      tenantId: v.string(),
      customerEmail: v.string(),
      amount: v.number(),
      status: v.union(
        v.literal("pending"),
        v.literal("success"),
        v.literal("failed"),
        v.literal("abandoned"),
      ),
      amountPaid: v.optional(v.number()),
      fees: v.optional(v.number()),
      platformFee: v.optional(v.number()),
      netAmount: v.optional(v.number()),
      paidAt: v.optional(v.string()),
      channel: v.optional(v.string()),
      failureReason: v.optional(v.string()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any, { payload }: any) => {
    const existing = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_reference", (q: any) => q.eq("reference", payload.reference))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: payload.status,
        amountPaid: payload.amountPaid,
        fees: payload.fees,
        platformFee: payload.platformFee,
        netAmount: payload.netAmount,
        paidAt: payload.paidAt,
        channel: payload.channel,
        failureReason: payload.failureReason,
        updatedAt: payload.updatedAt,
      });
      return existing._id;
    }

    return ctx.db.insert("paymentTransactions", {
      reference: payload.reference,
      tenantId: payload.tenantId,
      customerEmail: payload.customerEmail,
      amount: payload.amount,
      status: payload.status,
      amountPaid: payload.amountPaid,
      fees: payload.fees,
      platformFee: payload.platformFee,
      netAmount: payload.netAmount,
      paidAt: payload.paidAt,
      channel: payload.channel,
      failureReason: payload.failureReason,
      createdAt: payload.createdAt,
      updatedAt: payload.updatedAt,
    });
  },
});

/**
 * Records a file pipeline completion so server-side queries can check whether
 * a specific file has been processed without polling the Nexa API.
 *
 * Mount this in your `convex/nexa.ts`:
 * ```ts
 * export { upsertFileResultFromNexa } from "@nexa-ed/convex/mutations";
 * ```
 */
export const upsertFileResultFromNexa = mutationGeneric({
  args: {
    fileId: v.string(),
    userId: v.string(),
    tenantId: v.string(),
    status: v.optional(
      v.union(v.literal("completed"), v.literal("failed")),
    ),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any, { fileId, userId, tenantId, status = "completed" }: any) => {
    const existing = await ctx.db
      .query("nexaFileResults")
      .withIndex("by_fileId", (q: any) => q.eq("fileId", fileId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { status, completedAt: Date.now() });
      return existing._id;
    }

    return ctx.db.insert("nexaFileResults", {
      fileId,
      userId,
      tenantId,
      status,
      completedAt: Date.now(),
    });
  },
});
