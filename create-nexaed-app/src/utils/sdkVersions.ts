const REGISTRY = "https://registry.npmjs.org";

// npm's registry answers CORS + plain GET on /latest; the response's `version`
// is the truly newest publish. pnpm 11's minimumReleaseAge gate only applies to
// *range* resolution at install time, so writing the number into package.json
// makes a fresh app install the SDK the docs describe instead of a stale one.
export async function resolveLatestVersions(
  packages: string[],
): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  await Promise.all(
    packages.map(async (pkg) => {
      if (!/^(@[A-Za-z0-9._-]+\/)?[A-Za-z0-9._-]+$/.test(pkg)) return;
      try {
        const res = await fetch(`${REGISTRY}/${pkg}/latest`, {
          signal: AbortSignal.timeout(4000),
        });
        if (!res.ok) return;
        const body = (await res.json()) as { version?: unknown };
        if (
          typeof body.version === "string" &&
          /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/.test(body.version)
        ) {
          out[pkg] = body.version;
        }
      } catch {
        // Offline or slow registry: the caller falls back to "latest".
      }
    }),
  );
  return out;
}

export function nexaPackages(opts: { features: { convex: boolean } }): string[] {
  return opts.features.convex
    ? ["@nexa-ed/next", "@nexa-ed/react", "@nexa-ed/convex"]
    : ["@nexa-ed/next", "@nexa-ed/react"];
}
