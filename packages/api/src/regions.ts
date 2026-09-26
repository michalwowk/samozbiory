import { and, db } from "@repo/database";
import { z } from "zod";

import { meetsThreshold } from "./thresholds";

/**
 * Region reads. `@repo/api` is the only package allowed to touch `@repo/database` (ADR 0012), so every
 * region query in the product goes through here.
 *
 * Nothing in this module returns a Temporal value: Region has no date columns, but the rule from
 * ADR 0013 still applies to everything crossing into a component — convert to a string in this layer,
 * never in the component.
 */

const slugSchema = z
  .string()
  .min(1)
  .max(64)
  // Slugs come from the URL, so they are untrusted input (ADR 0007). Anchored to the shape our own
  // seeds produce, which keeps a crafted value from reaching the query at all.
  .regex(/^[a-z0-9-]+$/, "slug may contain only lowercase letters, digits and hyphens");

export const regionLevels = ["voivodeship", "county", "municipality"] as const;
export type RegionLevel = (typeof regionLevels)[number];

export type RegionSummary = {
  id: string;
  teryt: string;
  level: RegionLevel;
  name: string;
  slug: string;
  bbox: { minLat: number; maxLat: number; minLng: number; maxLng: number };
};

function toSummary(row: {
  id: string;
  teryt: string;
  level: string;
  name: string;
  slug: string;
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}): RegionSummary {
  return {
    id: row.id,
    teryt: row.teryt,
    level: row.level as RegionLevel,
    name: row.name,
    slug: row.slug,
    bbox: { minLat: row.minLat, maxLat: row.maxLat, minLng: row.minLng, maxLng: row.maxLng },
  };
}

const SUMMARY_FIELDS = [
  "id",
  "teryt",
  "level",
  "name",
  "slug",
  "minLat",
  "maxLat",
  "minLng",
  "maxLng",
] as const;

/** All 16 voivodeships, alphabetically. These pages always exist (ADR 0006). */
export async function listVoivodeships(): Promise<RegionSummary[]> {
  const rows = await db.orm.public.Region.select(...SUMMARY_FIELDS)
    .where({ level: "voivodeship" })
    .orderBy((r) => r.name.asc())
    .all();
  return rows.map(toSummary);
}

/** One region by level and slug. Slugs repeat across levels, so both are required. */
export async function regionBySlug(level: RegionLevel, slug: string): Promise<RegionSummary | null> {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) return null;

  const row = await db.orm.public.Region.select(...SUMMARY_FIELDS)
    .where({ level, slug: parsed.data })
    .first();
  return row ? toSummary(row) : null;
}

/** Direct children of a region, alphabetically — counties of a voivodeship, and so on. */
export async function childRegions(parentId: string): Promise<RegionSummary[]> {
  const rows = await db.orm.public.Region.select(...SUMMARY_FIELDS)
    .where({ parentId })
    .orderBy((r) => r.name.asc())
    .all();
  return rows.map(toSummary);
}

/**
 * Region ids covering a region and its descendants. A farm attaches to the most specific region known,
 * so counting a voivodeship means counting across its counties too.
 *
 * Two levels deep by design: TERYT has exactly three, so this terminates without recursive SQL.
 */
export async function regionScopeIds(regionId: string): Promise<string[]> {
  const children = await db.orm.public.Region.select("id").where({ parentId: regionId }).all();
  if (children.length === 0) return [regionId];

  const grandchildren = await db.orm.public.Region.select("id")
    .where((r) => r.parentId.in(children.map((c) => c.id)))
    .all();

  return [regionId, ...children.map((c) => c.id), ...grandchildren.map((g) => g.id)];
}

/** A region plus how many published farms it covers — the input to the ADR 0006 gate. */
export type RegionWithDensity = RegionSummary & { publishedFarmCount: number };

export async function childRegionsWithDensity(parentId: string): Promise<RegionWithDensity[]> {
  const children = await childRegions(parentId);

  return Promise.all(
    children.map(async (child) => {
      const scope = await regionScopeIds(child.id);
      const farms = await db.orm.public.Farm.select("id")
        .where((f) => and(f.regionId.in(scope), f.publishedAt.isNotNull()))
        .all();
      return { ...child, publishedFarmCount: farms.length };
    }),
  );
}

/**
 * Params for `generateStaticParams` on county pages: only those clearing the threshold. A county below
 * it must not render an empty page — it 404s (ADR 0006).
 */
export async function gatedCountyParams(): Promise<Array<{ wojewodztwo: string; powiat: string }>> {
  const voivodeships = await listVoivodeships();

  const nested = await Promise.all(
    voivodeships.map(async (voivodeship) => {
      const counties = await childRegionsWithDensity(voivodeship.id);
      return counties
        .filter((county) => meetsThreshold("county", county.publishedFarmCount))
        .map((county) => ({ wojewodztwo: voivodeship.slug, powiat: county.slug }));
    }),
  );

  return nested.flat();
}
