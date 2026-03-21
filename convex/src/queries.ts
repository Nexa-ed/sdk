import { queryGeneric } from "convex/server";
import { v } from "convex/values";

/**
 * Look up a single payment transaction by its Nexa/Paystack reference.
 *
 * Mount in `convex/nexa.ts`:
 * ```ts
 * export { getPaymentByReference } from "@nexa-ed/convex/queries";
 * ```
 *
 * Usage:
 * ```ts
 * const tx = await convex.query(api.nexa.getPaymentByReference, { reference });
 * ```
 */
export const getPaymentByReference = queryGeneric({
  args: { reference: v.string() },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any, { reference }: any) => {
    return ctx.db
      .query("paymentTransactions")
      .withIndex("by_reference", (q: any) => q.eq("reference", reference))
      .unique();
  },
});

/**
 * List all payment transactions for a customer email, newest first.
 *
 * Mount in `convex/nexa.ts`:
 * ```ts
 * export { getPaymentsByEmail } from "@nexa-ed/convex/queries";
 * ```
 */
export const getPaymentsByEmail = queryGeneric({
  args: {
    email: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("success"),
        v.literal("failed"),
        v.literal("abandoned"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any, { email, status, limit = 50 }: any) => {
    const results: any[] = await ctx.db
      .query("paymentTransactions")
      .withIndex("by_email", (q: any) => q.eq("customerEmail", email))
      .collect();

    const filtered = status ? results.filter((tx) => tx.status === status) : results;
    return filtered.sort((a, b) => b.createdAt - a.createdAt).slice(0, limit);
  },
});

/**
 * Check whether a file pipeline has completed processing.
 * Returns `null` if the file hasn't been recorded yet (still processing).
 *
 * Mount in `convex/nexa.ts`:
 * ```ts
 * export { getFileResult } from "@nexa-ed/convex/queries";
 * ```
 *
 * Usage:
 * ```ts
 * const result = await convex.query(api.nexa.getFileResult, { fileId });
 * if (result?.status === "completed") { ... }
 * ```
 */
export const getFileResult = queryGeneric({
  args: { fileId: v.string() },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any, { fileId }: any) => {
    return ctx.db
      .query("nexaFileResults")
      .withIndex("by_fileId", (q: any) => q.eq("fileId", fileId))
      .unique();
  },
});

/**
 * List all completed file results for a user.
 */
export const getFileResultsByUser = queryGeneric({
  args: { userId: v.string() },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: async (ctx: any, { userId }: any) => {
    return ctx.db
      .query("nexaFileResults")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .collect();
  },
});
