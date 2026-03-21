/**
 * @nexa-ed/convex
 *
 * Pre-built Convex schema fragments, mutations, queries, and callback factories
 * for Nexa-connected school apps using Convex as their backend.
 *
 * @example
 * ```ts
 * // convex/schema.ts
 * import { defineSchema } from "convex/server";
 * import { nexaPaymentsSchema, nexaFilesSchema } from "@nexa-ed/convex/schema";
 *
 * export default defineSchema({
 *   ...nexaPaymentsSchema,
 *   ...nexaFilesSchema,
 * });
 *
 * // convex/nexa.ts
 * export { upsertPaymentFromNexa, upsertFileResultFromNexa } from "@nexa-ed/convex/mutations";
 * export { getPaymentByReference, getPaymentsByEmail, getFileResult, getFileResultsByUser } from "@nexa-ed/convex/queries";
 *
 * // lib/nexa.ts
 * import { createPaymentCompleteHandler, createFileCompleteHandler } from "@nexa-ed/convex/handlers";
 * export const nexa = createNexa({
 *   onPaymentComplete: createPaymentCompleteHandler(convex, api),
 *   onFileComplete:    createFileCompleteHandler(convex, api),
 * });
 * ```
 */

export { nexaPaymentsSchema, nexaFilesSchema } from "./schema";
export { upsertPaymentFromNexa, upsertFileResultFromNexa } from "./mutations";
export { getPaymentByReference, getPaymentsByEmail, getFileResult, getFileResultsByUser } from "./queries";
export { createPaymentCompleteHandler, createFileCompleteHandler } from "./handlers";
