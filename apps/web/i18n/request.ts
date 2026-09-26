import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

/**
 * `requestLocale` is deprecated in next-intl 4.14 in favour of `next/root-params`, which Next 16 ships
 * (see node_modules/next/dist/docs/01-app/03-api-reference/04-functions/next-root-params.md). We read the
 * root param lazily so this file also works for the two cases where there is no `[locale]` segment:
 * an explicit `getTranslations({locale})` override, and a route rendered outside the segment.
 */
export default getRequestConfig(async ({ locale }) => {
  const resolved = hasLocale(routing.locales, locale) ? locale : await readRootLocale();

  return {
    locale: resolved,
    messages: (await import(`../messages/${resolved}.json`)).default,
    timeZone: "Europe/Warsaw",
  };
});

async function readRootLocale() {
  try {
    const { locale } = await import("next/root-params");
    const value = await locale();
    if (hasLocale(routing.locales, value)) return value;
  } catch {
    // No `[locale]` segment in scope — root params are unavailable rather than merely empty.
  }
  return routing.defaultLocale;
}
