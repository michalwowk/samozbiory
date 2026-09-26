import type { FarmSummary } from "@repo/api";
import { getTranslations } from "next-intl/server";

/**
 * The canonical content of every location page (ADR 0006). Rendered on the server, in HTML, because the
 * map is a client component Google cannot execute — it is an enhancement, never the content.
 *
 * `data-farm-slug` is load-bearing: the end-to-end test asserts against it to prove the list is in the
 * server response rather than hydrated in later.
 */
export async function FarmList({ farms }: { farms: FarmSummary[] }) {
  const t = await getTranslations("Location");

  if (farms.length === 0) {
    return <p className="text-muted-foreground">{t("noFarms")}</p>;
  }

  return (
    <ul className="flex flex-col gap-4">
      {farms.map((farm) => (
        <li
          key={farm.id}
          data-farm-slug={farm.slug}
          className="rounded-lg border border-border bg-card p-4"
        >
          <h3 className="font-medium text-card-foreground">{farm.name}</h3>
          {farm.description ? (
            <p className="mt-1 text-sm text-muted-foreground">{farm.description}</p>
          ) : null}
          <ul className="mt-2 flex flex-wrap gap-2">
            {farm.listings.map((listing) => (
              <li
                key={`${farm.id}-${listing.productSlug}`}
                className="rounded-md bg-accent px-2 py-1 text-xs text-accent-foreground"
              >
                {listing.productName} · {t("season", { from: listing.seasonFrom, to: listing.seasonTo })}
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}
