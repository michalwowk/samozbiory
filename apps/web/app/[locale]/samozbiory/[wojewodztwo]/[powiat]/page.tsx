import {
  farmsInRegion,
  gatedCountyParams,
  meetsThreshold,
  publishedFarmCount,
  regionBySlug,
} from "@repo/api";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { FarmList } from "../../../../../components/farm-list";
import { StructuredData } from "../../../../../components/structured-data";
import { env } from "../../../../../env";
import { Link } from "../../../../../i18n/navigation";

/**
 * County pages exist only above the density threshold (ADR 0006). `generateStaticParams` emits the ones
 * that clear it, and the component re-checks at request time so a county that thins out later starts
 * 404ing instead of serving a page with nothing on it.
 *
 * This is the file the mandatory end-to-end test guards. Breaking the gate is invisible — nothing
 * throws, pages just quietly become worthless and rankings drop months later.
 */
export async function generateStaticParams() {
  return gatedCountyParams();
}

async function loadGatedCounty(wojewodztwo: string, powiat: string) {
  const voivodeship = await regionBySlug("voivodeship", wojewodztwo);
  if (!voivodeship) return null;

  const county = await regionBySlug("county", powiat);
  if (!county || county.id === voivodeship.id) return null;

  const farmCount = await publishedFarmCount(county.id);
  if (!meetsThreshold("county", farmCount)) return null;

  return { voivodeship, county, farmCount };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ wojewodztwo: string; powiat: string }>;
}): Promise<Metadata> {
  const { wojewodztwo, powiat } = await params;
  const loaded = await loadGatedCounty(wojewodztwo, powiat);
  if (!loaded) return {};

  const t = await getTranslations("Location");
  return {
    title: t("countyTitle", { region: loaded.county.name }),
    description: t("countyDescription", { region: loaded.county.name }),
    alternates: { canonical: `/samozbiory/${wojewodztwo}/${powiat}` },
  };
}

export default async function CountyPage({
  params,
}: {
  params: Promise<{ wojewodztwo: string; powiat: string }>;
}) {
  const { wojewodztwo, powiat } = await params;
  const loaded = await loadGatedCounty(wojewodztwo, powiat);
  if (!loaded) notFound();

  const { voivodeship, county } = loaded;
  const t = await getTranslations("Location");
  const farms = await farmsInRegion(county.id);

  const breadcrumbs = [
    { name: t("breadcrumbHome"), path: "/" },
    { name: t("breadcrumbAll"), path: "/samozbiory" },
    { name: voivodeship.name, path: `/samozbiory/${voivodeship.slug}` },
    { name: county.name, path: `/samozbiory/${voivodeship.slug}/${county.slug}` },
  ];

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-8">
      <StructuredData
        region={county}
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
          {t("countyTitle", { region: county.name })}
        </h1>
        <p className="text-muted-foreground">{t("farmCount", { count: farms.length })}</p>
      </header>

      <FarmList farms={farms} />
    </main>
  );
}
