# 0007 — Prisma owns output types, Zod guards inputs

- **Status:** accepted
- **Date:** 2026-09-26

## Context

The project's stated goal is type safety that holds at runtime, and the obvious reading is "generate
Zod schemas from the database". That path is closed: `zod-prisma-types` and `prisma-zod-generator`
hook into `generator` blocks in `schema.prisma`, and a Prisma 8 contract has none.

It is also the wrong goal. Prisma 8 already guarantees row shapes at runtime through codecs
(`pg/text@1`, `pg/timestamptz-temporal@1`). A hand-maintained Zod schema mirroring a table is
duplication that drifts. Types can only lie where data enters from outside our control.

## Decision

- **Output types come from Prisma.** `Models.public_Farm` from `contract.d.ts` is the Prisma 8
  equivalent of Prisma 7's `Prisma.Farm` / `GetPayload` (see *Naming model and result types* in the
  shipped `references/queries.md`). No codegen, no third-party generator.
- **Zod 4 guards inputs only**, at these boundaries:

  | Boundary | Why it matters here |
  |---|---|
  | `searchParams` | the main untrusted surface: `?bbox=&lat=&lng=&product=`, user-controlled and pasted from search results |
  | Farmer-submitted forms | data entering a public directory |
  | Environment variables | `process.env.X!` is a lie told to the compiler |
  | Webhooks and third-party APIs | anything we do not compile |

- Where an input shape genuinely mirrors a model, the Zod schema is **pinned to the Prisma type**
  (`satisfies z.ZodType<...>`) so drift is a compile error rather than a runtime surprise.

## Consequences

- "Database as source of truth" is realised by the **direction of the type arrow**: Prisma generates,
  Zod is checked against it, never the reverse.
- We do not build a `contract.json` → Zod generator. It would couple us to an unstable format inside a
  release-candidate product, and would need repair on every `rc.x` bump, for the benefit of a handful
  of forms.
- `@t3-oss/env-nextjs` is at `0.13.11`, i.e. pre-1.0, so environment validation is a small local Zod
  module instead — consistent with ADR 0003 scoping the pre-release exception to Prisma alone.
