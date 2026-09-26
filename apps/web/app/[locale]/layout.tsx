import { hasLocale, NextIntlClientProvider } from "next-intl";
import { locale as rootLocale } from "next/root-params";
import { notFound } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { routing } from "../../i18n/routing";
import { env } from "../../env";
import "../globals.css";

// Without metadataBase, `alternates.canonical` resolves to a relative URL and Next warns. Google
// tolerates relative canonicals, but on a product whose distribution is search there is no reason to
// leave it ambiguous (ADR 0006).
export const metadata = { metadataBase: new URL(env.NEXT_PUBLIC_SITE_URL) };

// The [locale] segment acts as a catch-all for unknown routes, so an invalid value must 404 rather than
// render with a fallback locale (ADR 0011).
//
// NuqsAdapter wraps the tree because filters and the map bbox live in searchParams — the main surface of
// untrusted input in this product, and the one Zod guards (ADR 0007).
export default async function LocaleLayout({ children }: { children: React.ReactNode }) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();

  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider>
          <NuqsAdapter>{children}</NuqsAdapter>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}
