import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../generated/contract.d";
import contractJson from "../generated/contract.json" with { type: "json" };
import { env } from "./env";

// `env` validates DATABASE_URL, loads dotenv and installs the Temporal polyfill, so none of those is
// repeated here (ADR 0007, ADR 0013).
export const db = postgres<Contract>({
  contractJson,
  url: env.DATABASE_URL,
});

// Predicate combinators are standalone functions, not methods on an expression — `f.a.eq(1).and(...)`
// does not exist. Re-exported here so the @prisma/orm-postgres dependency stays in this package and
// @repo/api has exactly one import source for data access.
export { and, not, or } from "@prisma/orm-postgres/orm-client";
