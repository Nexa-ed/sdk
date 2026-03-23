# @nexa-ed/next

Next.js adapter for the [Nexa Education Platform](https://docs.nexa-ed.com). Mounts all Nexa API route handlers into your Next.js app with a single call.

## Install

```bash
npm install @nexa-ed/next @nexa-ed/sdk
# or
pnpm add @nexa-ed/next @nexa-ed/sdk
```

## Peer dependencies

```bash
npm install next
```

## Quick start

```ts
// app/api/nexa/[...nexaed]/route.ts
import { createNexa } from "@nexa-ed/next";

const { GET, POST } = createNexa({
  apiKey: process.env.NEXA_API_KEY!,
});

export { GET, POST };
```

## Documentation

| Topic | Link |
|-------|------|
| Installation | [docs.nexa-ed.com/docs/getting-started/installation](https://docs.nexa-ed.com/docs/getting-started/installation) |
| Quickstart | [docs.nexa-ed.com/docs/getting-started/quickstart](https://docs.nexa-ed.com/docs/getting-started/quickstart) |

## License

MIT
