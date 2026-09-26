// ADR 0013. Prisma 8 reads and writes Temporal values for Date/Timestamp/Timestamptz/Time columns, and
// `globalThis.Temporal` only exists from Node 26.8.2. This project pins Node 24, so without the polyfill
// the first read of Listing.seasonFrom throws RUNTIME.TEMPORAL_UNAVAILABLE.
//
// It lives here rather than in client.ts because prisma.config.ts imports this module too, so one line
// covers every entry point. Delete it — and this comment — once Node 26 is LTS; nothing else changes.
import "temporal-polyfill/full/global";
// The runtime import above installs globalThis.Temporal but ships no type declarations
// (`full/global.d.ts` is literally `export {}`). This second import is what makes `Temporal` a known
// global to tsc.
import "temporal-polyfill/types/global";
import { config as loadDotenv } from "dotenv";
import { join } from "node:path";
import { z } from "zod";

// dotenv reads `.env` from the process working directory, which is whatever package or app was invoked.
// That covers `apps/web` (Next loads its own) and the Prisma CLI (it injects ours), but not a script run
// from a sibling package such as @repo/api. Load the CWD file first so an app's values win, then fall
// back to this package's own. dotenv never overwrites an already-set variable, so order is precedence.
loadDotenv();
try {
  loadDotenv({ path: join(__dirname, "..", ".env") });
} catch {
  // Bundled builds have no meaningful __dirname, and there the platform supplies the environment.
}

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
