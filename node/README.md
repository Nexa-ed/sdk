# @nexa-ed/node

Framework-agnostic Node.js adapter for the [Nexa Education Platform](https://docs.nexa-ed.com). Supports Express, Fastify, and Hono out of the box.

## Install

```bash
npm install @nexa-ed/node @nexa-ed/sdk
# or
pnpm add @nexa-ed/node @nexa-ed/sdk
```

## Peer dependencies

Install the framework(s) you use — all are optional:

```bash
npm install express   # or fastify, or hono
```

## Quick start

```ts
// Hono
import { Hono } from "hono";
import { createNexaHono } from "@nexa-ed/node/hono";

const app = new Hono();
app.route("/nexa", createNexaHono({ apiKey: process.env.NEXA_API_KEY! }));
```

## Documentation

| Framework | Link |
|-----------|------|
| Express | [docs.nexa-ed.com/docs/node/express](https://docs.nexa-ed.com/docs/node/express) |
| Fastify | [docs.nexa-ed.com/docs/node/fastify](https://docs.nexa-ed.com/docs/node/fastify) |
| Hono | [docs.nexa-ed.com/docs/node/hono](https://docs.nexa-ed.com/docs/node/hono) |
| Overview | [docs.nexa-ed.com/docs/node](https://docs.nexa-ed.com/docs/node) |

## License

MIT
