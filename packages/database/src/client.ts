import postgres from "@prisma/orm-postgres/runtime";
import type { Contract } from "../generated/contract.d";
import contractJson from "../generated/contract.json" with { type: "json" };
import { env } from "./env";

// `env` validates DATABASE_URL and imports dotenv, so neither is repeated here (ADR 0007).
export const db = postgres<Contract>({
  contractJson,
  url: env.DATABASE_URL,
});
