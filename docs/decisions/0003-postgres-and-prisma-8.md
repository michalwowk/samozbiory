# 0003 — PostgreSQL 18 with Prisma 8, accepting a pre-release dependency

- **Status:** accepted
- **Date:** 2026-09-26

## Context

The project has a standing policy of running released versions only. Prisma 8 is **not** generally
available: the `prisma` CLI publishes `8.0.0-rc.17` to the `latest` tag while `@prisma/client` ships
`7.10.0` as its stable line, and `@prisma/orm-postgres` exists **only** as `8.0.0-rc.x`.

Prisma 8 is also architecturally different from everything before it. There is no `@prisma/client`, no
`generator` blocks, and no `prisma migrate dev`. You author a *data contract* and the framework emits
`contract.json` / `contract.d.ts` and plans migrations from the contract diff.

Critically, Prisma 8 is built agent-first: it ships a complete skill inside the npm package
(`packages/database/node_modules/@prisma/orm-postgres/skills/prisma-8/`) and `prisma skills sync` mirrors it into one
directory per coding harness. That capability is the foundation of ADR 0004.

## Decision

Prisma 8 (`prisma@8.0.0-rc.17`, `@prisma/orm-postgres@8.0.0-rc.12`) on PostgreSQL 18.6, as an explicit,
scoped exception to the released-versions-only policy. The exception covers Prisma and nothing else.

## Consequences

- The CLI and the ORM package version independently and **were already out of sync in this repo**
  (`rc.15` CLI against `rc.11` ORM). Bump them together, never one alone.
- `prisma` publishes release candidates to `latest`. Never install Prisma with a floating range; the
  lockfile is load-bearing.
- Ecosystem packages that expect `@prisma/client` do not work. This already bites: Better Auth's
  Prisma adapter declares `@prisma/client: ^5 || ^6 || ^7` — see ADR 0010.
- Migrations on a release candidate are the one irreversible risk here. Review every planned migration
  before applying it to anything holding real data.
- **Exit condition:** revisit when Prisma 8 reaches GA, or immediately if a migration-correctness bug
  surfaces. Downgrading means rewriting `packages/database` against `schema.prisma` + `@prisma/client`.
