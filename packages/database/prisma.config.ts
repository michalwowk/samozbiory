import { defineConfig as ormConfig } from "@prisma/orm-postgres/config";
import { definePrismaConfig } from "prisma/config";

import { env } from "./src/env";

// The annotation is required: base.json enables `declaration`, and the inferred config type is not
// nameable without reaching into @prisma/orm-framework internals, which user code must not import.
const config: ReturnType<typeof definePrismaConfig> = definePrismaConfig({
  orm: ormConfig({
    contract: "./prisma/schema.prisma",
    output: "./generated",
    db: {
      connection: env.DATABASE_URL,
    },
  }),
});

export default config;
