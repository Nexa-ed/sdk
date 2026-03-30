import type { MetadataRoute } from "next";
import { source } from "@/lib/source";

const DOCS_URL = "https://docs.nexa-ed.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  // Root and docs landing
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: DOCS_URL,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${DOCS_URL}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // All docs pages from Fumadocs source
  const docRoutes: MetadataRoute.Sitemap = source.getPages().map((page) => ({
    url: `${DOCS_URL}${page.url}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...docRoutes];
}
