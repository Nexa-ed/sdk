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
 * Convex table definition for student email accounts provisioned via Nexa.
 *
 * Spread this into your `defineSchema()` call:
 *
 * ```ts
 * import { nexaStudentEmailsSchema } from "@nexa-ed/convex/schema";
 *
 * export default defineSchema({
 *   ...nexaStudentEmailsSchema,
 * });
 * ```
 */
export const nexaStudentEmailsSchema = {
  studentEmails: defineTable({
    /** Your internal student identifier */
    studentId: v.string(),
    tenantId: v.string(),
    /** Provisioned email address, e.g. "amara.obi@loretto.edu.ng" */
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    gradeLevel: v.optional(v.string()),
    /** Email infrastructure provider */
    provider: v.optional(
      v.union(v.literal("nexa"), v.literal("stalwart"), v.literal("google")),
    ),
    /** Provider-assigned user ID */
    providerUserId: v.optional(v.string()),
    tier: v.optional(
      v.union(
        v.literal("tier-1-nexa"),
        v.literal("tier-2-stalwart"),
        v.literal("tier-3-google"),
      ),
    ),
    status: v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("deleted"),
    ),
    passwordResetRequired: v.optional(v.boolean()),
    recoveryEmail: v.optional(v.string()),
    aliases: v.optional(v.array(v.string())),
    /** Unix timestamp (ms) */
    createdAt: v.number(),
    /** Unix timestamp (ms) */
    updatedAt: v.number(),
  })
    .index("by_email",   ["email"])
    .index("by_tenant",  ["tenantId"])
    .index("by_student", ["tenantId", "studentId"])
    .index("by_status",  ["tenantId", "status"]),
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
