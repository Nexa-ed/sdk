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
 * Idempotent upsert for a student email account received via webhook or
 * pulled from `nexa.email.list()`.
 *
 * Safe to call multiple times for the same email address — creates on first
 * call, patches status and metadata on subsequent calls.
 *
 * Mount this in your `convex/nexa.ts`:
 * ```ts
 * export { upsertStudentEmailFromNexa } from "@nexa-ed/convex/mutations";
 * ```
 */
export const upsertStudentEmailFromNexa = mutationGeneric({
  args: {
    payload: v.object({
      studentId:             v.string(),
      tenantId:              v.string(),
      email:                 v.string(),
      firstName:             v.string(),
      lastName:              v.string(),
      gradeLevel:            v.optional(v.string()),
      provider:              v.optional(v.union(v.literal("nexa"), v.literal("stalwart"), v.literal("google"))),
      providerUserId:        v.optional(v.string()),
      tier:                  v.optional(v.union(v.literal("tier-1-nexa"), v.literal("tier-2-stalwart"), v.literal("tier-3-google"))),
      status:                v.union(v.literal("active"), v.literal("suspended"), v.literal("deleted")),
      passwordResetRequired: v.optional(v.boolean()),
      recoveryEmail:         v.optional(v.string()),
      aliases:               v.optional(v.array(v.string())),
      createdAt:             v.number(),
      updatedAt:             v.number(),
    }),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any, { payload }: any) => {
    const existing = await ctx.db
      .query("studentEmails")
      .withIndex("by_email", (q: any) => q.eq("email", payload.email))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        status:                payload.status,
        gradeLevel:            payload.gradeLevel,
        providerUserId:        payload.providerUserId,
        passwordResetRequired: payload.passwordResetRequired,
        recoveryEmail:         payload.recoveryEmail,
        aliases:               payload.aliases,
        updatedAt:             payload.updatedAt,
      });
      return existing._id;
    }

    return ctx.db.insert("studentEmails", {
      studentId:             payload.studentId,
      tenantId:              payload.tenantId,
      email:                 payload.email,
      firstName:             payload.firstName,
      lastName:              payload.lastName,
      gradeLevel:            payload.gradeLevel,
      provider:              payload.provider,
      providerUserId:        payload.providerUserId,
      tier:                  payload.tier,
      status:                payload.status,
      passwordResetRequired: payload.passwordResetRequired,
      recoveryEmail:         payload.recoveryEmail,
      aliases:               payload.aliases,
      createdAt:             payload.createdAt,
      updatedAt:             payload.updatedAt,
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
