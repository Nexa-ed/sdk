# @nexa-ed/convex

Convex schema fragments, mutations, queries, and handler factories for the [Nexa Education Platform](https://docs.nexa-ed.com). Integrate Nexa's reactive backend directly into your Convex project.

## Install

```bash
npm install @nexa-ed/convex @nexa-ed/sdk
# or
pnpm add @nexa-ed/convex @nexa-ed/sdk
```

## Peer dependencies

```bash
npm install convex
```

## Quick start

```ts
// convex/schema.ts
import { defineSchema } from "convex/server";
import { nexaPaymentsSchema, nexaFilesSchema } from "@nexa-ed/convex/schema";

export default defineSchema({
  ...nexaPaymentsSchema,
  ...nexaFilesSchema,
});
```

## Documentation

| Topic | Link |
|-------|------|
| Installation | [docs.nexa-ed.com/docs/getting-started/installation](https://docs.nexa-ed.com/docs/getting-started/installation) |
| Quickstart | [docs.nexa-ed.com/docs/getting-started/quickstart](https://docs.nexa-ed.com/docs/getting-started/quickstart) |

## License

MIT
