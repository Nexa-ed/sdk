import { defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex table definition for payment transactions received from Nexa.
 *
 * Spread this into your `defineSchema()` call:
 *
 * ```ts
 * import { nexaPaymentsSchema, nexaFilesSchema } from "@nexa-ed/convex/schema";
 *
 * export default defineSchema({
 *   ...nexaPaymentsSchema,
 *   ...nexaFilesSchema,
 * });
 * ```
 */
export const nexaPaymentsSchema = {
  paymentTransactions: defineTable({
    /** Nexa / Paystack payment reference — unique per transaction */
    reference: v.string(),
    tenantId: v.string(),
    customerEmail: v.string(),
    /** Amount in smallest currency unit (kobo for NGN) */
    amount: v.number(),
    /** Actual settled amount after Paystack fees */
    amountPaid: v.optional(v.number()),
    fees: v.optional(v.number()),
    platformFee: v.optional(v.number()),
    netAmount: v.optional(v.number()),
    status: v.union(
      v.literal("pending"),
      v.literal("success"),
      v.literal("failed"),
      v.literal("abandoned"),
    ),
    /** ISO 8601 date string from Paystack */
    paidAt: v.optional(v.string()),
    /** Payment channel, e.g. "card", "bank" */
    channel: v.optional(v.string()),
    failureReason: v.optional(v.string()),
    /** Unix timestamp (ms) — when the transaction was created on Nexa */
    createdAt: v.number(),
    /** Unix timestamp (ms) — when the transaction was last updated */
    updatedAt: v.number(),
  })
    .index("by_reference", ["reference"])
    .index("by_email", ["customerEmail"])
    .index("by_tenant", ["tenantId"])
    .index("by_status", ["status"]),
};

/**
 * Convex table definition for file pipeline completions received from Nexa.
 *
 * Spread this into your `defineSchema()` call alongside `nexaPaymentsSchema`.
 */
export const nexaFilesSchema = {
  nexaFileResults: defineTable({
    /** NeonDB pipeline file ID from the `file.completed` webhook */
    fileId: v.string(),
    /** Clerk user ID */
    userId: v.string(),
    tenantId: v.string(),
    status: v.union(v.literal("completed"), v.literal("failed")),
    /** Unix timestamp (ms) */
    completedAt: v.number(),
  })
    .index("by_fileId", ["fileId"])
    .index("by_userId", ["userId"])
    .index("by_tenant", ["tenantId"]),
};
