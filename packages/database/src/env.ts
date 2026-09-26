import "dotenv/config";
import { z } from "zod";

/**
 * Environment validation for the data layer (ADR 0007: Zod guards inputs, and an environment variable
 * is an input).
 *
 * This replaces `process.env.DATABASE_URL!`. The non-null assertion was a lie told to the compiler: it
 * turned a missing variable into a confusing runtime failure deep inside the driver, rather than a clear
 * one at startup.
 *
 * Hand-written rather than `@t3-oss/env-nextjs`, which is still pre-1.0 — ADR 0003 scopes the
 * pre-release exception to Prisma alone.
 */
const schema = z.object({
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is empty")
    .refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), {
      message: "DATABASE_URL must be a postgres:// or postgresql:// connection string",
    }),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((issue) => `  ${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment for @repo/database:\n${details}\n\n` +
      "Copy .env.example to packages/database/.env and check the values match docker-compose.yml.",
  );
}

export const env = parsed.data;
