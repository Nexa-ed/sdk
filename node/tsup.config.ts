import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    express: "src/adapters/express.ts",
    fastify: "src/adapters/fastify.ts",
    hono: "src/adapters/hono.ts",
  },
  format: ["cjs", "esm"],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "node18",
  external: ["express", "fastify", "hono", "@nexa-ed/sdk"],
});
