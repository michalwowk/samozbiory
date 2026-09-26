# Working with the database

Prisma 8 documents itself inside `node_modules` — that is the reference, and this guide does not repeat
it. Start at `packages/database/node_modules/@prisma/orm-postgres/skills/prisma-8/SKILL.md`, whose routing table names the
right `references/` file per task.

What follows is only what is specific to **this repository**.

## Adding a field, end to end

```sh
# 1. edit the contract
$EDITOR packages/database/prisma/schema.prisma

# 2. emit artifacts — types come from here, nothing is hand-written
pnpm generate

# 3. apply to your dev database
pnpm db:push

# 4. if the change ships, plan a reviewable migration
pnpm --filter @repo/database exec prisma migration plan
```

Step 2 is not optional and not automatic: there is **no first-party Next.js plugin** for contract emit
(only Vite has one). `prebuild` and `predev` cover builds, but editing the contract while `next dev` is
already running requires running `pnpm generate` yourself.

## Before your first migration

Read `references/migration-model.md`. `migration plan` does **not** chain from the newest migration on
disk — its origin is `--from`, else the `db` ref, else an empty database. Getting this wrong on a project
with existing migrations produces `MIGRATION.PLAN_ORIGIN_UNKNOWN`, and the reflexive fix
(`--from @empty`) is usually not the one you want.

## Traps specific to this setup

**Dates throw on Node 24.** `Date`, `Timestamp`, `Timestamptz` and `Time` columns read and write
`Temporal` values, which need `globalThis.Temporal` — shipped from Node 26.8.2 only. This repo pins
Node 24, so the first read of a date column raises `RUNTIME.TEMPORAL_UNAVAILABLE`. Do not add a date
column before [ADR 0013](../decisions/0013-date-representation.md) is settled.

**Two packages, one version.** `prisma` (CLI) and `@prisma/orm-postgres` (ORM) version independently and
have already drifted apart once here. Bump them together. And because `prisma` publishes release
candidates to the `latest` npm tag, never install it with a floating range — the lockfile is load-bearing.

**Auth tables are not yours.** `user`, `session`, `account` and `verification` are owned by Better Auth.
They appear in the contract as `@@control(external)`: Prisma types and reads them, but never plans DDL
for them. Do not "fix" the drift this appears to create
([ADR 0010](../decisions/0010-better-auth-owns-auth-tables.md)).

## Who may query

Only `@repo/api`. `apps/*` importing `@repo/database` fails `pnpm lint`
([ADR 0012](../decisions/0012-data-access-boundary.md)). Authorisation lives beside the query, in
`@repo/api`, so that "a farmer may only edit their own farm" exists in exactly one place.

## Types

Model and result types come from `generated/contract.d.ts`. See *Naming model and result types* in
`references/queries.md` for `Models.public_<Model>`, `ResultType`, `Scalars` and `Shape` — these are the
Prisma 8 equivalents of Prisma 7's `Prisma.User` and `GetPayload`.

Do not write Zod schemas mirroring table shapes. Prisma guarantees row shapes at runtime through codecs;
a parallel Zod copy is duplication that drifts. Zod guards **inputs**
([ADR 0007](../decisions/0007-prisma-owns-types-zod-guards-inputs.md)).
