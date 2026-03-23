# Nexa Education Platform

**Infrastructure for modern school software.** Nexa gives developers the APIs, SDKs, and tools to build enrollment, payments, document processing, and student record management into any school app — in minutes, not months.

---

## Packages

| Package | Description | Version |
|---------|-------------|---------|
| [`@nexa-ed/sdk`](https://npmjs.com/package/@nexa-ed/sdk) | Core HTTP client — files, documents, payments, services, webhooks | ![npm](https://img.shields.io/npm/v/@nexa-ed/sdk?label=) |
| [`@nexa-ed/react`](https://npmjs.com/package/@nexa-ed/react) | React components and hooks | ![npm](https://img.shields.io/npm/v/@nexa-ed/react?label=) |
| [`@nexa-ed/next`](https://npmjs.com/package/@nexa-ed/next) | Next.js adapter — mount all route handlers in one call | ![npm](https://img.shields.io/npm/v/@nexa-ed/next?label=) |
| [`@nexa-ed/node`](https://npmjs.com/package/@nexa-ed/node) | Node.js adapter — Express, Fastify, and Hono support | ![npm](https://img.shields.io/npm/v/@nexa-ed/node?label=) |
| [`@nexa-ed/convex`](https://npmjs.com/package/@nexa-ed/convex) | Convex schema fragments and handler factories | ![npm](https://img.shields.io/npm/v/@nexa-ed/convex?label=) |
| [`create-nexaed-app`](https://npmjs.com/package/create-nexaed-app) | CLI scaffolder — new school app in seconds | ![npm](https://img.shields.io/npm/v/create-nexaed-app?label=) |

---

## Quick start

```bash
npx create-nexaed-app@latest
```

Or install manually:

```bash
npm install @nexa-ed/sdk
```

```ts
import { NexaClient } from "@nexa-ed/sdk";

const nexa = new NexaClient({ apiKey: process.env.NEXA_API_KEY });
```

---

## Documentation

Full guides, API reference, and framework examples at **[docs.nexa-ed.com](https://docs.nexa-ed.com)**.

| | |
|---|---|
| [Getting started](https://docs.nexa-ed.com/docs/getting-started/quickstart) | [SDK reference](https://docs.nexa-ed.com/docs/sdk/files) |
| [React components](https://docs.nexa-ed.com/docs/react/components) | [Node adapters](https://docs.nexa-ed.com/docs/node) |
| [REST API](https://docs.nexa-ed.com/docs/rest-api) | [CLI](https://docs.nexa-ed.com/docs/getting-started/cli) |

---

<sub>Built for schools. Designed for developers.</sub>
