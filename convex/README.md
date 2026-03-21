# `@nexa-ed/convex`

> **Status: Planned — not yet released.**
> This document describes the intended design.
> Track progress in the SDK ROADMAP.

Pre-built Convex schema fragments and callback factories for Nexa-connected
school apps that use [Convex](https://convex.dev) as their backend.

---

## Why this exists

When you wire up `createNexa()` in `lib/nexa.ts` you implement two callbacks:

```ts
onFileComplete:    async ({ fileId, userId }) => { /* sync to your DB */ },
onPaymentComplete: async (event)              => { /* sync to your DB */ },
```

Without this package you have to:

1. Design and write the Convex table schema for payments + file results
2. Write `upsertFromNexa` mutations by hand
3. Map the webhook event fields to your schema manually — getting types wrong

`@nexa-ed/convex` ships all of that for you. Install once, write zero schema.

---

## Installation

```bash
pnpm add @nexa-ed/convex
```

---

## Usage

### 1 — Add schema fragments to your Convex schema

```ts
// convex/schema.ts
import { defineSchema } from "convex/server";
import { nexaPaymentsSchema, nexaFilesSchema } from "@nexa-ed/convex/schema";

export default defineSchema({
  // Your existing tables
  users: defineTable({ ... }),

  // Drop these in — zero configuration
  ...nexaPaymentsSchema,   // → paymentTransactions table
  ...nexaFilesSchema,      // → nexaFileResults table
});
```

### 2 — Mount the pre-built mutations

```ts
// convex/nexa.ts  ← new file, one line each
export { upsertPaymentFromNexa, upsertFileResultFromNexa } from "@nexa-ed/convex/mutations";
```

### 3 — Use the callback factories in `lib/nexa.ts`

```ts
import { createNexa } from "@nexa-ed/next";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";
import {
  createPaymentCompleteHandler,
  createFileCompleteHandler,
} from "@nexa-ed/convex/handlers";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const nexa = createNexa({
  apiKey:        process.env.NEXA_API_KEY!,
  webhookSecret: process.env.NEXA_WEBHOOK_SECRET!,
  getUser: async () => {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");
    return { userId };
  },

  // ↓ These two lines replace everything you'd otherwise write by hand
  onPaymentComplete: createPaymentCompleteHandler(convex, api),
  onFileComplete:    createFileCompleteHandler(convex, api),
});
```

That's it. Every `payment.completed` and `file.completed` webhook is now
persisted in your Convex database with full idempotency.

---

## What gets created

### `nexaPaymentsSchema` — `paymentTransactions` table

| Column | Type | Notes |
|--------|------|-------|
| `reference` | `string` | Nexa/Paystack reference — indexed |
| `tenantId` | `string` | |
| `customerEmail` | `string` | indexed |
| `amount` | `number` | kobo |
| `amountPaid` | `number?` | actual settled amount |
| `fees` | `number?` | |
| `netAmount` | `number?` | |
| `status` | `"pending"\|"success"\|"failed"\|"abandoned"` | indexed |
| `paidAt` | `string?` | ISO date from Paystack |
| `channel` | `string?` | e.g. `"card"`, `"bank"` |
| `failureReason` | `string?` | |
| `createdAt` | `number` | unix ms |
| `updatedAt` | `number` | unix ms |

### `nexaFilesSchema` — `nexaFileResults` table

| Column | Type | Notes |
|--------|------|-------|
| `fileId` | `string` | NeonDB pipeline file ID — indexed |
| `userId` | `string` | Clerk user ID — indexed |
| `tenantId` | `string` | |
| `status` | `"completed"\|"failed"` | |
| `completedAt` | `number` | unix ms |

---

## Pre-built mutations

### `upsertPaymentFromNexa`

Idempotent upsert — safe to call from both the `payment.completed` webhook and
your verify route's smart-pull. Creates on first call, patches on subsequent.

```ts
await convex.mutation(api.nexa.upsertPaymentFromNexa, { payload: event });
```

### `upsertFileResultFromNexa`

Records the pipeline file completion in your tenant database so server-side
queries can check completion without polling the Nexa API.

```ts
await convex.mutation(api.nexa.upsertFileResultFromNexa, { fileId, userId, tenantId });
```

---

## Pre-built queries

```ts
import { api } from "../convex/_generated/api";

// Get a payment by reference
const tx = await convex.query(api.nexa.getPaymentByReference, { reference });

// Get all payments for a user
const txs = await convex.query(api.nexa.getPaymentsByEmail, { email });

// Check if a file pipeline has finished
const result = await convex.query(api.nexa.getFileResult, { fileId });
```

---

## Selective adoption

Don't want the file results table? Only import what you need:

```ts
import { nexaPaymentsSchema } from "@nexa-ed/convex/schema";   // payments only
import { nexaFilesSchema }    from "@nexa-ed/convex/schema";   // files only
```

Same for mutations — you can skip the factories and write your own callbacks
while still using the schema fragments and pre-built queries.

---

## Opting out entirely

If you prefer to design your own schema you can ignore this package completely.
The `onPaymentComplete` and `onFileComplete` callbacks in `createNexa()` are
plain async functions — wire them to whatever database you use.

---

## Compatibility

| Package | Version |
|---------|---------|
| `convex` | `>=1.9.0` |
| `@nexa-ed/next` | same version as this package |
| Next.js | `>=14` |
