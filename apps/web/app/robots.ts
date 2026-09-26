import type { MetadataRoute } from "next";

import { env } from "../env";
import { generateSitemaps } from "./sitemap";

/**
 * `generateSitemaps()` serves `/sitemap/<id>.xml` and Next does **not** create an index at
 * `/sitemap.xml` (see node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-sitemaps.md).
 * Pointing robots.txt at a single `/sitemap.xml` would point crawlers at a 404.
 *
 * The chunk list is derived from the same function that produces the chunks, so it cannot drift.
 * robots.txt may carry several `Sitemap:` lines, which is protocol-valid and simpler than hand-rolling a
 * sitemap index.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const chunks = await generateSitemaps();

  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: chunks.map(({ id }) => `${env.NEXT_PUBLIC_SITE_URL}/sitemap/${id}.xml`),
  };
}
