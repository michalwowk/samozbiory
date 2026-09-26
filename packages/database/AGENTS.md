# @repo/database

Prisma 8 data contract and runtime client. **Only `@repo/api` may import this package** — `apps/*` is
blocked by ESLint ([ADR 0012](../../docs/decisions/0012-data-access-boundary.md)).

## This is not the Prisma you know

Prisma 8 is contract-first and shares almost no surface with Prisma 7 or earlier. If you are about to
write `prisma generate`, `prisma migrate dev`, `PrismaClient`, `@prisma/client`, or a `generator` block,
**stop** — none of those exist here.

The installed package documents itself. Read it before writing code — these paths resolve from
**this file's own directory** (`packages/database/`), since pnpm does not hoist to the repo root:

```
node_modules/@prisma/orm-postgres/skills/prisma-8/SKILL.md      ← routing table, start here
node_modules/@prisma/orm-postgres/skills/prisma-8/references/
    contract.md            models, fields, relations, @@control, extensions (postgis, pgvector)
    migrations.md          db update vs migration plan, data transforms, destructive changes
    migration-model.md     the migration graph, refs, plan origin — read before your first migration
    queries.md             db.orm and db.sql, and "Naming model and result types" for model types
    queries-postgres.md    Postgres specifics
    runtime.md             db.ts wiring, middleware, pooling, transactions
    build.md               bundler integration and its documented gaps
    debug.md               every structured error code
```

That skill states its own version in `metadata.library_version`. If it does not match the installed
`@prisma/orm-postgres`, run `pnpm skills:sync` and re-read before continuing.

## Commands

| Task | Command |
|---|---|
| Emit contract artifacts | `pnpm generate` → `prisma contract emit` |
| Apply contract to a dev database | `pnpm db:push` → `prisma db update` |
| Plan a committed migration | `pnpm exec prisma migration plan` |
| Apply committed migrations | `pnpm db:migrate:deploy` → `prisma db migrate` |
| Format the contract | `pnpm run format` → `prisma contract format` |
| Refresh vendored skills | `pnpm run skills:sync` |

`generated/` is derived and gitignored. Never hand-edit `contract.json` or `contract.d.ts`.

## Things that will bite you here

- **Dates are `Temporal`, not `Date`.** On PostgreSQL, `Date` / `Timestamp` / `Timestamptz` / `Time`
  read and write `Temporal` values, which need `globalThis.Temporal` — present from Node 26.8.2 only.
  This repo is on Node 24, so the first read of a date column throws `RUNTIME.TEMPORAL_UNAVAILABLE`
  until [ADR 0013](../../docs/decisions/0013-date-representation.md) is settled. Do not add a date
  column without reading it.
- **No Next.js plugin for contract emit.** Only Vite has one. `prebuild` and `predev` cover builds;
  editing the contract while `next dev` runs needs a manual `pnpm generate`.
- **Auth tables are not ours.** Better Auth owns the DDL for `user`, `session`, `account` and
  `verification`; they appear here as `@@control(external)` so Prisma types them but never migrates
  them ([ADR 0010](../../docs/decisions/0010-better-auth-owns-auth-tables.md)).
- **The CLI and the ORM package version separately** and were already out of sync once in this repo.
  Bump `prisma` and `@prisma/orm-postgres` together, never one alone.
- **`prisma` publishes release candidates to the `latest` tag.** Never install it with a floating range.

## Types

Model and result types come from `generated/contract.d.ts` — see *Naming model and result types* in
`references/queries.md` for `Models.public_<Model>`, `ResultType`, `Scalars` and `Shape`. Do not write
Zod schemas mirroring table shapes; Prisma already guarantees them at runtime
([ADR 0007](../../docs/decisions/0007-prisma-owns-types-zod-guards-inputs.md)).
