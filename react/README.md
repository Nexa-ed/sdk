# @nexa-ed/react

React components and hooks for the [Nexa Education Platform](https://docs.nexa-ed.com). Drop-in UI for file uploads, student records, analysis jobs, pipeline status, and payments.

## Install

```bash
npm install @nexa-ed/react @nexa-ed/sdk
# or
pnpm add @nexa-ed/react @nexa-ed/sdk
```

## Peer dependencies

```bash
npm install react react-dom @tanstack/react-query lucide-react
```

## Quick start

```tsx
import { NexaProvider } from "@nexa-ed/react";

export default function App({ children }) {
  return (
    <NexaProvider apiKey={process.env.NEXT_PUBLIC_NEXA_API_KEY}>
      {children}
    </NexaProvider>
  );
}
```

## Documentation

| Topic | Link |
|-------|------|
| Components | [docs.nexa-ed.com/docs/react/components](https://docs.nexa-ed.com/docs/react/components) |
| Hooks | [docs.nexa-ed.com/docs/react/hooks](https://docs.nexa-ed.com/docs/react/hooks) |

## License

MIT
