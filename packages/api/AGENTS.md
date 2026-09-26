# @repo/api

The only data-access surface applications may use. Plain async functions: Zod on the way in, `@repo/database`
underneath, authorisation beside the query. Repo-wide rules live in the root [`AGENTS.md`](../../AGENTS.md).

## Why this package exists at all

`apps/*` importing `@repo/database` fails `pnpm lint`
([ADR 0012](../../docs/decisions/0012-data-access-boundary.md)). In a two-sided marketplace,
authorisation is the one thing that must not be duplicated: "a farmer may only edit their own farm"
lives here, once. If a Server Component could reach the ORM directly, eventually one would — without
the ownership check.

## Two rules

### 1. Temporal never crosses into a component

Prisma returns `Temporal.PlainDate` and `Temporal.Instant` for date columns. React serialises `Date` but
not class instances, so passing one to a client component throws
([ADR 0013](../../docs/decisions/0013-date-representation.md)).

Convert in **this** layer, never in the component:

```ts
seasonFrom: row.seasonFrom.toString(),   // "2026-06-15"
```

This also keeps `temporal-polyfill` out of the browser bundle, since date arithmetic stays server-side.

### 2. Procedures are additive only

Do not remove a field, narrow a type, make an optional input required, or change what a value means. A
breaking change is a **new function** ([ADR 0017](../../docs/decisions/0017-additive-only-api-procedures.md)).
Today that costs nothing; after the first mobile release it is the only thing between a routine refactor
and broken phones in users' hands.

## The density gate

`thresholds.ts` is the single place deciding whether a location page exists. `gatedCountyParams()` feeds
`generateStaticParams`, so a county below the threshold never gets a route
([ADR 0006](../../docs/decisions/0006-geo-seo-density-gated-pages.md)).

Breaking this is **invisible** — nothing throws, pages just quietly become worthless. Never relax a
threshold to "get more pages indexed"; that is the failure mode, not the goal.

## Prisma 8 query API — what it is not

Verified against the shipped docs and the live database, because the shape differs from every ORM in
training data:

| Reality | The habit it breaks |
|---|---|
| `db.orm.public.Farm.select("id", "slug").where(...).all()` | `findMany({ select: { id: true } })` does not exist |
| `.all()` returns an `AsyncIterableResult` — **single consumption**, a second `await` throws `RUNTIME.ITERATOR_CONSUMED` | reusing the result value |
| No `.count()` terminal. `count()` is an `include` reducer or an `aggregate(...)` op | `.count()` on a collection |
| `and(a, b)` / `or(...)` / `not(...)` are **functions**, re-exported from `@repo/database` | `a.and(b)` — expressions have no `.and` method |
| Relation predicates: `.some(...)`, `.none(...)`, `.every(...)` | filtering related rows in JS after fetching them |
| Collection-level `.first()` issues `LIMIT 1`; `.all().first()` fetches everything and discards it | using `.all().first()` for a single row |
| An N:1 `include` types as **nullable** even with a non-nullable FK | assuming it is non-null |

Full reference: `packages/database/node_modules/@prisma/orm-postgres/skills/prisma-8/references/queries-postgres.md`.

## Adding a function

1. Validate every input with Zod — these are reached from `searchParams` and forms, the only places types
   can lie ([ADR 0007](../../docs/decisions/0007-prisma-owns-types-zod-guards-inputs.md)).
2. Cap anything that bounds work (`limit`, bbox extent). An unbounded value from the URL is a
   denial-of-service knob.
3. Return plain serialisable data. No Temporal, no class instances.
4. Batch related reads. `listingsByFarm` exists so rendering a list is not N+1.
