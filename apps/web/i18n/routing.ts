import { defineRouting } from "next-intl/routing";

/**
 * ADR 0011: Polish is the default locale and serves WITHOUT a prefix, so location pages stay at
 * `/samozbiory/malopolskie`. A future locale would be prefixed (`/en/...`).
 */
export const routing = defineRouting({
  locales: ["pl"],
  defaultLocale: "pl",
  localePrefix: "as-needed",
});

export type AppLocale = (typeof routing.locales)[number];

