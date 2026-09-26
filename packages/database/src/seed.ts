import { db } from "./client";

/**
 * Seeds the administrative hierarchy plus enough sample data to exercise the density thresholds from
 * ADR 0006. Idempotent: every write is an upsert keyed on a natural unique column, so running it twice
 * changes nothing.
 *
 * TERYT codes are the real GUS identifiers. Bounding boxes are **approximations** good enough to frame a
 * map; replace them with authoritative GUS/GIS geometry before they are used for anything but framing.
 */

type RegionSeed = {
  teryt: string;
  name: string;
  slug: string;
  bbox: [minLng: number, minLat: number, maxLng: number, maxLat: number];
};

const VOIVODESHIPS: RegionSeed[] = [
  { teryt: "02", name: "dolnośląskie", slug: "dolnoslaskie", bbox: [14.8, 50.1, 17.9, 51.8] },
  { teryt: "04", name: "kujawsko-pomorskie", slug: "kujawsko-pomorskie", bbox: [17.2, 52.3, 19.8, 53.8] },
  { teryt: "06", name: "lubelskie", slug: "lubelskie", bbox: [21.5, 50.2, 24.2, 52.3] },
  { teryt: "08", name: "lubuskie", slug: "lubuskie", bbox: [14.5, 51.3, 16.5, 53.2] },
  { teryt: "10", name: "łódzkie", slug: "lodzkie", bbox: [18.0, 50.9, 20.6, 52.4] },
  { teryt: "12", name: "małopolskie", slug: "malopolskie", bbox: [19.1, 49.1, 21.5, 50.5] },
  { teryt: "14", name: "mazowieckie", slug: "mazowieckie", bbox: [19.3, 51.0, 23.2, 53.5] },
  { teryt: "16", name: "opolskie", slug: "opolskie", bbox: [16.9, 49.9, 18.7, 51.2] },
  { teryt: "18", name: "podkarpackie", slug: "podkarpackie", bbox: [21.1, 48.9, 23.6, 50.9] },
  { teryt: "20", name: "podlaskie", slug: "podlaskie", bbox: [21.5, 52.2, 23.9, 54.5] },
  { teryt: "22", name: "pomorskie", slug: "pomorskie", bbox: [16.7, 53.5, 19.7, 54.9] },
  { teryt: "24", name: "śląskie", slug: "slaskie", bbox: [18.0, 49.4, 19.9, 51.1] },
  { teryt: "26", name: "świętokrzyskie", slug: "swietokrzyskie", bbox: [19.7, 50.2, 21.9, 51.4] },
  { teryt: "28", name: "warmińsko-mazurskie", slug: "warminsko-mazurskie", bbox: [19.1, 53.1, 22.9, 54.5] },
  { teryt: "30", name: "wielkopolskie", slug: "wielkopolskie", bbox: [15.7, 51.2, 19.2, 53.7] },
  { teryt: "32", name: "zachodniopomorskie", slug: "zachodniopomorskie", bbox: [14.1, 52.6, 17.0, 54.6] },
];

/**
 * Counties for małopolskie only. Enough to make the ADR 0006 threshold observable: `krakowski` gets six
 * published farms and must produce a page, `tatrzanski` gets one and must not.
 */
const COUNTIES: Array<RegionSeed & { parentTeryt: string }> = [
  { teryt: "1206", parentTeryt: "12", name: "krakowski", slug: "krakowski", bbox: [19.5, 49.8, 20.4, 50.3] },
  { teryt: "1217", parentTeryt: "12", name: "tatrzański", slug: "tatrzanski", bbox: [19.7, 49.2, 20.2, 49.5] },
  { teryt: "1210", parentTeryt: "12", name: "nowosądecki", slug: "nowosadecki", bbox: [20.3, 49.3, 21.1, 49.8] },
];

const PRODUCTS = [
  { slug: "truskawki", name: "Truskawki" },
  { slug: "maliny", name: "Maliny" },
  { slug: "jablka", name: "Jabłka" },
  { slug: "borowki", name: "Borówki" },
  { slug: "wisnie", name: "Wiśnie" },
  { slug: "dynie", name: "Dynie" },
];

/** [slug, name, countyTeryt, lat, lng, productSlug, seasonFrom, seasonTo] */
const FARMS: Array<[string, string, string, number, number, string, string, string]> = [
  ["truskawki-u-kowalskich", "Truskawki u Kowalskich", "1206", 50.12, 19.88, "truskawki", "2026-06-01", "2026-07-10"],
  ["sad-pod-lasem", "Sad pod Lasem", "1206", 50.05, 19.71, "jablka", "2026-09-01", "2026-10-25"],
  ["malinowy-zagon", "Malinowy Zagon", "1206", 50.21, 20.05, "maliny", "2026-06-20", "2026-08-15"],
  ["borowkowe-wzgorze", "Borówkowe Wzgórze", "1206", 50.18, 19.95, "borowki", "2026-07-01", "2026-08-31"],
  ["wisnie-od-antka", "Wiśnie od Antka", "1206", 49.95, 19.82, "wisnie", "2026-06-25", "2026-07-20"],
  ["dyniowa-polana", "Dyniowa Polana", "1206", 50.09, 20.15, "dynie", "2026-09-10", "2026-10-31"],
  // Single farm: tatrzanski must stay below the threshold and produce no page.
  ["podhalanska-truskawka", "Podhalańska Truskawka", "1217", 49.32, 19.94, "truskawki", "2026-06-15", "2026-07-05"],
];

async function main() {
  const voivodeships = new Map<string, string>();
  for (const r of VOIVODESHIPS) {
    const [minLng, minLat, maxLng, maxLat] = r.bbox;
    const row = await db.orm.public.Region.upsert({
      create: { teryt: r.teryt, level: "voivodeship", name: r.name, slug: r.slug, minLat, maxLat, minLng, maxLng },
      update: { name: r.name, slug: r.slug, minLat, maxLat, minLng, maxLng },
      conflictOn: { teryt: r.teryt },
    });
    voivodeships.set(r.teryt, row.id);
  }

  const counties = new Map<string, string>();
  for (const c of COUNTIES) {
    const [minLng, minLat, maxLng, maxLat] = c.bbox;
    const parentId = voivodeships.get(c.parentTeryt);
    if (!parentId) throw new Error(`Unknown parent voivodeship ${c.parentTeryt} for county ${c.teryt}`);
    const row = await db.orm.public.Region.upsert({
      create: { teryt: c.teryt, level: "county", name: c.name, slug: c.slug, parentId, minLat, maxLat, minLng, maxLng },
      update: { name: c.name, slug: c.slug, parentId, minLat, maxLat, minLng, maxLng },
      conflictOn: { teryt: c.teryt },
    });
    counties.set(c.teryt, row.id);
  }

  const products = new Map<string, string>();
  for (const p of PRODUCTS) {
    const row = await db.orm.public.Product.upsert({
      create: p,
      update: { name: p.name },
      conflictOn: { slug: p.slug },
    });
    products.set(p.slug, row.id);
  }

  // Temporal, not Date — Prisma 8 reads and writes Temporal for date columns (ADR 0013).
  const now = Temporal.Now.instant();

  for (const [slug, name, countyTeryt, lat, lng, productSlug, from, to] of FARMS) {
    const regionId = counties.get(countyTeryt);
    const productId = products.get(productSlug);
    if (!regionId || !productId) throw new Error(`Missing region or product for farm ${slug}`);

    const farm = await db.orm.public.Farm.upsert({
      create: { slug, name, lat, lng, regionId, publishedAt: now },
      update: { name, lat, lng, regionId, publishedAt: now },
      conflictOn: { slug },
    });

    // Collection-level `.first()` issues LIMIT 1; `.all().first()` would fetch everything and discard it.
    const existing = await db.orm.public.Listing.where({ farmId: farm.id, productId }).first();
    if (existing === null) {
      await db.orm.public.Listing.create({
        farmId: farm.id,
        productId,
        seasonFrom: Temporal.PlainDate.from(from),
        seasonTo: Temporal.PlainDate.from(to),
      });
    }
  }

  const regions = await db.orm.public.Region.select("id").all();
  const farms = await db.orm.public.Farm.select("id").all();
  const listings = await db.orm.public.Listing.select("id").all();
  console.log(
    `Seeded ${regions.length} regions, ${PRODUCTS.length} products, ${farms.length} farms, ${listings.length} listings.`,
  );
}

// `void main()` rather than top-level await: this package is CommonJS, so tsx rejects top-level await.
void (async () => {
  try {
    await main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    // The façade-owned pool keeps Node's event loop alive, so a script must close it explicitly.
    await db.close();
  }
})();
