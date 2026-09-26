/**
 * Generates `src/styles/theme.css` from `src/tokens.ts` (ADR 0008).
 *
 * The emitted shape is not ours to invent — it is the contract shadcn 4 expects: `@theme inline`
 * mapping `--color-*` onto bare custom properties, those properties defined per colour scheme, and a
 * `@layer base` block wiring body and borders. It was derived by running `shadcn init` in a throwaway
 * project and reading what it wrote, rather than from memory.
 *
 * Run: pnpm --filter @repo/ui run build:theme
 */
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { semantic, shape } from "../src/tokens";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "src", "styles", "theme.css");

const tokenNames = Object.keys(semantic.light) as Array<keyof typeof semantic.light>;

/** shadcn derives its whole radius scale from a single `--radius` with calc(). */
const RADIUS_SCALE: Array<[string, string]> = [
  ["sm", "calc(var(--radius) * 0.6)"],
  ["md", "calc(var(--radius) * 0.8)"],
  ["lg", "var(--radius)"],
  ["xl", "calc(var(--radius) * 1.4)"],
  ["2xl", "calc(var(--radius) * 1.8)"],
  ["3xl", "calc(var(--radius) * 2.2)"],
  ["4xl", "calc(var(--radius) * 2.6)"],
];

const block = (scheme: "light" | "dark") =>
  tokenNames.map((name) => `  --${name}: ${semantic[scheme][name]};`).join("\n");

const css = `/* GENERATED FILE — DO NOT EDIT.
   Source: packages/ui/src/tokens.ts
   Regenerate: pnpm --filter @repo/ui run build:theme
   Why generated: tokens are data so a future React Native client can consume them (ADR 0008). */

@import "tailwindcss";
@import "tw-animate-css";
@import "shadcn/tailwind.css";

@custom-variant dark (&:is(.dark *));

/* Tailwind scans for class names relative to this file. Applications add their own @source for their
   own directories; this one covers the shared components. */
@source "../components";

@theme inline {
  --font-sans: var(--font-sans);
  --font-heading: var(--font-sans);

${tokenNames.map((name) => `  --color-${name}: var(--${name});`).join("\n")}

${RADIUS_SCALE.map(([key, value]) => `  --radius-${key}: ${value};`).join("\n")}
}

:root {
  /* Applications may override with next/font; this fallback keeps \`font-sans\` resolvable on its own. */
  --font-sans:
    ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  --radius: ${shape.radius};

${block("light")}
}

.dark {
${block("dark")}
}

@layer base {
  * {
    @apply border-border outline-ring/50;
  }
  body {
    @apply bg-background text-foreground;
  }
  html {
    @apply font-sans;
  }
}
`;

writeFileSync(OUT, css, "utf8");
console.log(
  `theme.css: ${tokenNames.length} semantic tokens x 2 schemes, ${RADIUS_SCALE.length} radius steps`,
);
