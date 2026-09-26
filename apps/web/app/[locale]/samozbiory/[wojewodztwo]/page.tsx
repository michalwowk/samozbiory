import {
  childRegionsWithDensity,
  farmsInRegion,
  listVoivodeships,
  meetsThreshold,
  regionBySlug,
} from "@repo/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FarmList } from "../../../../components/farm-list";
import { StructuredData } from "../../../../components/structured-data";
import { env } from "../../../../env";
import { Link } from "../../../../i18n/navigation";

/**
 * Voivodeship pages always exist — 16 of them, each with real content (ADR 0006). This is the level the
 * whole location hierarchy starts from, and the one that never needs a density gate.
 */
export async function generateStaticParams() {
  const voivodeships = await listVoivodeships();
  return voivodeships.map((region) => ({ wojewodztwo: region.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wojewodztwo: string }>;
}): Promise<Metadata> {
  const { wojewodztwo } = await params;
  const region = await regionBySlug("voivodeship", wojewodztwo);
  if (!region) return {};

  const t = await getTranslations("Location");
  return {
    title: t("voivodeshipTitle", { region: region.name }),
    description: t("voivodeshipDescription", { region: region.name }),
    alternates: { canonical: `/samozbiory/${region.slug}` },
  };
}

export default async function VoivodeshipPage({
  params,
}: {
  params: Promise<{ wojewodztwo: string }>;
}) {
  const { wojewodztwo } = await params;
  const region = await regionBySlug("voivodeship", wojewodztwo);
  if (!region) notFound();

  const t = await getTranslations("Location");
  const [farms, counties] = await Promise.all([
    farmsInRegion(region.id),
    childRegionsWithDensity(region.id),
  ]);

  // Only counties that earn their own page are linked. Linking a page that 404s would be worse than
  // omitting the link (ADR 0006).
  const linkableCounties = counties.filter((county) =>
    meetsThreshold("county", county.publishedFarmCount),
  );

  const breadcrumbs = [
    { name: t("breadcrumbHome"), path: "/" },
    { name: t("breadcrumbAll"), path: "/samozbiory" },
    { name: region.name, path: `/samozbiory/${region.slug}` },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <StructuredData
        region={region}
        farms={farms}
        breadcrumbs={breadcrumbs}
        baseUrl={env.NEXT_PUBLIC_SITE_URL}
      />

      <nav aria-label={t("breadcrumbAll")}>
        <ol className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {breadcrumbs.map((crumb, index) => (
            <li key={crumb.path} className="flex gap-2">
              {index > 0 ? <span aria-hidden>/</span> : null}
              {index === breadcrumbs.length - 1 ? (
                <span aria-current="page">{crumb.name}</span>
              ) : (
                <Link href={crumb.path} className="hover:text-foreground">
                  {crumb.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {t("voivodeshipTitle", { region: region.name })}
        </h1>
        <p className="text-muted-foreground">{t("farmCount", { count: farms.length })}</p>
      </header>

      {/* The list is the canonical content. A map, when it arrives, goes below it and adds nothing
          Google needs to see. */}
      <FarmList farms={farms} />

      {linkableCounties.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h2 className="text-lg font-medium text-foreground">{t("counties")}</h2>
          <ul className="flex flex-wrap gap-2">
            {linkableCounties.map((county) => (
              <li key={county.id}>
                <Link
                  href={`/samozbiory/${region.slug}/${county.slug}`}
                  className="rounded-md border border-border px-3 py-1 text-sm hover:bg-muted"
                >
                  {county.name} ({county.publishedFarmCount})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
