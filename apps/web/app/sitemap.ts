import { gatedCountyParams, listVoivodeships } from "@repo/api";
import type { MetadataRoute } from "next";

import { env } from "../env";

/**
 * Chunked from the start rather than retrofitted: the sitemap protocol caps a file at 50,000 URLs, and
 * that ceiling is reached as soon as county and product pages open up (ADR 0006).
 *
 * Only URLs that actually exist are emitted. A sitemap listing a 404 is worse than omitting the entry,
 * and the density gate means plenty of conceivable URLs do not exist.
 *
 * Lives outside the `[locale]` segment on purpose: Polish is the unprefixed default, so sitemap URLs
 * carry no locale prefix, and `proxy.ts` excludes this path from locale rewriting (ADR 0011).
 */
const URLS_PER_SITEMAP = 40_000;

async function allUrls(): Promise<MetadataRoute.Sitemap> {
  const [voivodeships, counties] = await Promise.all([listVoivodeships(), gatedCountyParams()]);

  return [
    { url: `${env.NEXT_PUBLIC_SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    ...voivodeships.map((region) => ({
      url: `${env.NEXT_PUBLIC_SITE_URL}/samozbiory/${region.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...counties.map(({ wojewodztwo, powiat }) => ({
      url: `${env.NEXT_PUBLIC_SITE_URL}/samozbiory/${wojewodztwo}/${powiat}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

export async function generateSitemaps() {
  const urls = await allUrls();
  const count = Math.max(1, Math.ceil(urls.length / URLS_PER_SITEMAP));
  return Array.from({ length: count }, (_, id) => ({ id }));
}

/**
 * Next 16 breaking change: `id` arrives as a **Promise that resolves to a string**, not a number (see the
 * version history in
 * node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-sitemaps.md).
 *
 * Treating it as a number yields `NaN` bounds, and `slice(NaN, NaN)` returns an empty array — a silently
 * empty sitemap behind a perfectly green build. Caught only by fetching the XML.
 */
export default async function sitemap(props: { id: Promise<string> }): Promise<MetadataRoute.Sitemap> {
  const chunk = Number(await props.id);
  if (!Number.isInteger(chunk) || chunk < 0) return [];

  const urls = await allUrls();
  return urls.slice(chunk * URLS_PER_SITEMAP, (chunk + 1) * URLS_PER_SITEMAP);
}
