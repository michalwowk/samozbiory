import { getTranslations } from "next-intl/server";

import { Button } from "@repo/ui/components/button";

// Placeholder that exercises the whole chain: tokens.ts -> theme.css -> Tailwind, and pl.json ->
// next-intl -> here. No Polish string literals: copy lives in messages/pl.json (ADR 0005, ADR 0011).
// The real home page arrives with the location pages, reading through @repo/api (ADR 0012).
export default async function IndexPage() {
  const t = await getTranslations("Home");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">{t("title")}</h1>
      <p className="text-muted-foreground">{t("tagline")}</p>
      <div className="flex gap-3">
        <Button>{t("findFarm")}</Button>
        <Button variant="outline">{t("addFarm")}</Button>
      </div>
    </main>
  );
}
