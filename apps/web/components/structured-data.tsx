import type { FarmSummary, RegionSummary } from "@repo/api";

/**
 * JSON-LD for location pages. Part of the canonical content, not decoration: it is how Google learns
 * that a page is a list of real businesses in a real place (ADR 0006).
 *
 * Emitted as a plain script tag rather than through a library — the payload is small, fully typed at the
 * call site, and one fewer dependency in the SEO path that everything else depends on.
 */
export function StructuredData({
  region,
  farms,
  breadcrumbs,
  baseUrl,
}: {
  region: RegionSummary;
  farms: FarmSummary[];
  breadcrumbs: Array<{ name: string; path: string }>;
  baseUrl: string;
}) {
  const graph = [
    {
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: `${baseUrl}${crumb.path}`,
      })),
    },
    {
      "@type": "ItemList",
      name: region.name,
      numberOfItems: farms.length,
      itemListElement: farms.map((farm, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "LocalBusiness",
          name: farm.name,
          ...(farm.description ? { description: farm.description } : {}),
          url: `${baseUrl}/gospodarstwo/${farm.slug}`,
          geo: { "@type": "GeoCoordinates", latitude: farm.lat, longitude: farm.lng },
          address: { "@type": "PostalAddress", addressRegion: region.name, addressCountry: "PL" },
          makesOffer: farm.listings.map((listing) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Product", name: listing.productName },
            availabilityStarts: listing.seasonFrom,
            availabilityEnds: listing.seasonTo,
          })),
        },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      // The payload is built from our own database rows, not user input, and JSON.stringify escapes the
      // content. The `</script>` sequence cannot appear in a JSON string literal unescaped.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }),
      }}
    />
  );
}
