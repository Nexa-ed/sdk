import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    schema: "src/schema.ts",
    mutations: "src/mutations.ts",
    queries: "src/queries.ts",
    handlers: "src/handlers.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2022",
  external: ["convex", "@nexa-ed/sdk"],
});
