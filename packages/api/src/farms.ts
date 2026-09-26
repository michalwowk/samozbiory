import { and, db } from "@repo/database";
import { z } from "zod";

import { regionScopeIds } from "./regions";

/**
 * Farm reads. Zod validates every input because these are reached from `searchParams` and forms — the
 * only places where types can actually lie (ADR 0007).
 *
 * **Temporal never crosses the RSC boundary** (ADR 0013). React serialises `Date` but not class
 * instances, so `Temporal.PlainDate` would throw on the way into a client component. Every date leaves
 * this layer as an ISO string, which also keeps the polyfill out of the browser bundle.
 */

/** Poland's extent, give or take. Rejecting anything outside it turns a crafted bbox into a 422, not a
 *  full-table scan. */
const LNG = z.number().min(13.5).max(24.5);
const LAT = z.number().min(48.5).max(55.0);

export const searchFarmsInput = z.object({
  /** [minLng, minLat, maxLng, maxLat] — the map viewport. */
  bbox: z.tuple([LNG, LAT, LNG, LAT]).refine(([w, s, e, n]) => w < e && s < n, {
    message: "bbox must be [minLng, minLat, maxLng, maxLat] with min < max",
  }),
  product: z
    .string()
    .max(64)
    .regex(/^[a-z0-9-]+$/)
    .optional(),
  /** Capped: an unbounded limit from the URL is a denial-of-service knob. */
  limit: z.number().int().min(1).max(200).default(60),
});

export type SearchFarmsInput = z.input<typeof searchFarmsInput>;

export type FarmSummary = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
  /** ISO date strings, never Temporal — see the note at the top of this file. */
  listings: Array<{ productSlug: string; productName: string; seasonFrom: string; seasonTo: string }>;
};

const FARM_FIELDS = ["id", "slug", "name", "description", "lat", "lng"] as const;

type FarmRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  lat: number;
  lng: number;
};

/** One round-trip for the listings of many farms, so rendering a list is not N+1. */
async function listingsByFarm(farmIds: string[]) {
  if (farmIds.length === 0) return new Map<string, FarmSummary["listings"]>();

  const rows = await db.orm.public.Listing.select("farmId", "seasonFrom", "seasonTo")
    .where((l) => l.farmId.in(farmIds))
    .include("product", (product) => product.select("slug", "name"))
    .orderBy((l) => l.seasonFrom.asc())
    .all();

  const grouped = new Map<string, FarmSummary["listings"]>();
  for (const row of rows) {
    // An N:1 include types as nullable even though Listing.productId is non-nullable with a Restrict
    // foreign key. Unreachable in practice; throwing documents the invariant rather than silently
    // dropping a row or asserting non-null.
    if (!row.product) throw new Error(`Listing ${row.farmId} has no product — broken foreign key`);
    const entry = {
      productSlug: row.product.slug,
      productName: row.product.name,
      // Temporal.PlainDate -> "2026-06-15". The conversion belongs here, not in a component.
      seasonFrom: row.seasonFrom.toString(),
      seasonTo: row.seasonTo.toString(),
    };
    const existing = grouped.get(row.farmId);
    if (existing) existing.push(entry);
    else grouped.set(row.farmId, [entry]);
  }
  return grouped;
}

async function toSummaries(farms: FarmRow[]): Promise<FarmSummary[]> {
  const listings = await listingsByFarm(farms.map((f) => f.id));
  return farms.map((farm) => ({ ...farm, listings: listings.get(farm.id) ?? [] }));
}

/**
 * Published farms inside a map viewport, optionally narrowed to one product.
 *
 * Bounding box on indexed columns rather than PostGIS, which is the reversible starting position
 * (ADR 0014). At the scale of Polish direct-sale farms — thousands, not millions — this is single-digit
 * milliseconds.
 */
export async function searchFarms(rawInput: SearchFarmsInput): Promise<FarmSummary[]> {
  const {
    bbox: [minLng, minLat, maxLng, maxLat],
    product,
    limit,
  } = searchFarmsInput.parse(rawInput);

  // Resolve the slug to an id once, so the product filter becomes an indexed predicate inside the main
  // query rather than a fetch-everything-and-filter-in-JS pass.
  let productId: string | null = null;
  if (product) {
    const row = await db.orm.public.Product.select("id").where({ slug: product }).first();
    if (!row) return [];
    productId = row.id;
  }

  const farms = await db.orm.public.Farm.select(...FARM_FIELDS)
    .where((f) => {
      const clauses = [
        f.lng.gte(minLng),
        f.lng.lte(maxLng),
        f.lat.gte(minLat),
        f.lat.lte(maxLat),
        f.publishedAt.isNotNull(),
      ];
      // `.some(...)` is a relation predicate — it recurses into the relation in SQL.
      if (productId !== null) clauses.push(f.listings.some((l) => l.productId.eq(productId)));
      return and(...clauses);
    })
    .orderBy((f) => f.name.asc())
    .limit(limit)
    .all();

  return toSummaries(farms);
}

/**
 * Published farms covered by a region and its descendants. This is what a location page renders as its
 * canonical, server-rendered content — the map is an enhancement Google cannot execute (ADR 0006).
 */
export async function farmsInRegion(regionId: string, limit = 200): Promise<FarmSummary[]> {
  const scope = await regionScopeIds(regionId);

  const farms = await db.orm.public.Farm.select(...FARM_FIELDS)
    .where((f) => and(f.regionId.in(scope), f.publishedAt.isNotNull()))
    .orderBy((f) => f.name.asc())
    .limit(limit)
    .all();

  return toSummaries(farms);
}

/** How many published farms a region covers — the number the ADR 0006 gate is applied to. */
export async function publishedFarmCount(regionId: string): Promise<number> {
  const scope = await regionScopeIds(regionId);
  const rows = await db.orm.public.Farm.select("id")
    .where((f) => and(f.regionId.in(scope), f.publishedAt.isNotNull()))
    .all();
  return rows.length;
}

export async function farmBySlug(slug: string): Promise<FarmSummary | null> {
  const parsed = z
    .string()
    .max(96)
    .regex(/^[a-z0-9-]+$/)
    .safeParse(slug);
  if (!parsed.success) return null;

  const farm = await db.orm.public.Farm.select(...FARM_FIELDS)
    .where((f) => and(f.slug.eq(parsed.data), f.publishedAt.isNotNull()))
    .first();
  if (!farm) return null;

  const [summary] = await toSummaries([farm]);
  return summary ?? null;
}
