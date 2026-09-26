import { z } from "zod";

/**
 * Application environment. Hand-written on Zod rather than `@t3-oss/env-nextjs`, which is pre-1.0 —
 * ADR 0003 scopes the pre-release exception to Prisma alone (ADR 0007).
 *
 * DATABASE_URL is deliberately absent: `apps/web` never touches the database directly (ADR 0012).
 * `@repo/database` validates it where it is used.
 */
const schema = z.object({
  /** Absolute origin, no trailing slash. Sitemap URLs and JSON-LD `item` values must be absolute. */
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .refine((value) => !value.endsWith("/"), { message: "must not end with a slash" }),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment for apps/web:\n${details}\n\nSee .env.example at the repository root.`,
  );
}

export const env = parsed.data;
