"use client";

import { createContext, useContext, useMemo } from "react";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type NexaOrpc = any;

interface NexaReactContext {
  basePath: string;
  orpc: NexaOrpc;
}

const NexaContext = createContext<NexaReactContext | null>(null);

/**
 * NexaProvider — wraps your app (or a subtree) to provide the Nexa SDK
 * context to all hooks and components.
 *
 * Requires `@tanstack/react-query`'s `QueryClientProvider` to be present
 * higher in the tree.
 *
 * No configuration needed — just add it once to your providers and all
 * `@nexa-ed/react` hooks and components work automatically.
 *
 * @param basePath - Advanced override for the SDK route mount path.
 *   Defaults to `/api/nexa` — only change this if you mounted
 *   `createRouteHandler` at a custom path.
 *
 * @example
 * ```tsx
 * // providers.tsx (zero-config — this is all you need)
 * <QueryClientProvider client={queryClient}>
 *   <NexaProvider>
 *     <App />
 *   </NexaProvider>
 * </QueryClientProvider>
 * ```
 */
export function NexaProvider({
  basePath = "/api/nexa",
  children,
}: {
  basePath?: string;
  children: React.ReactNode;
}) {
  const value = useMemo<NexaReactContext>(() => {
    const link = new RPCLink({ url: `${basePath}/rpc` });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const client = createORPCClient(link) as any;
    const orpc = createTanstackQueryUtils(client);
    return { basePath, orpc };
  }, [basePath]);

  return <NexaContext.Provider value={value}>{children}</NexaContext.Provider>;
}

/**
 * Access the Nexa context inside a component.
 * Must be used within a `NexaProvider`.
 */
export function useNexaContext(): NexaReactContext {
  const ctx = useContext(NexaContext);
  if (!ctx) {
    throw new Error(
      "[nexa-ed] useNexaContext must be called inside a <NexaProvider>. " +
        "Wrap your app with <NexaProvider> (inside QueryClientProvider).",
    );
  }
  return ctx;
}
