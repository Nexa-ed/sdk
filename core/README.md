# @nexa-ed/sdk

The core JavaScript/TypeScript client for the [Nexa Education Platform](https://docs.nexa-ed.com). Provides typed HTTP modules for files, documents, payments, services, and webhooks.

## Install

```bash
npm install @nexa-ed/sdk
# or
pnpm add @nexa-ed/sdk
```

## Quick start

```ts
import { NexaClient } from "@nexa-ed/sdk";

const nexa = new NexaClient({ apiKey: process.env.NEXA_API_KEY });
```

## Documentation

| Topic | Link |
|-------|------|
| Installation | [docs.nexa-ed.com/docs/getting-started/installation](https://docs.nexa-ed.com/docs/getting-started/installation) |
| Quickstart | [docs.nexa-ed.com/docs/getting-started/quickstart](https://docs.nexa-ed.com/docs/getting-started/quickstart) |
| Files | [docs.nexa-ed.com/docs/sdk/files](https://docs.nexa-ed.com/docs/sdk/files) |
| Documents | [docs.nexa-ed.com/docs/sdk/documents](https://docs.nexa-ed.com/docs/sdk/documents) |
| Payments | [docs.nexa-ed.com/docs/sdk/payments](https://docs.nexa-ed.com/docs/sdk/payments) |
| Services | [docs.nexa-ed.com/docs/sdk/services](https://docs.nexa-ed.com/docs/sdk/services) |
| Webhooks | [docs.nexa-ed.com/docs/sdk/webhooks](https://docs.nexa-ed.com/docs/sdk/webhooks) |

## License

MIT
