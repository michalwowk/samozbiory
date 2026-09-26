# Architecture decisions

One file per decision, MADR-lite: *Context · Decision · Consequences · Status*. Numbers are sequential
and never reused. A decision that is reversed gets `superseded` and a pointer to the one replacing it —
we do not delete history.

`proposed` means the decision is **deliberately open**, with its options and consequences written down.
That is not the same as undecided-by-omission, and the distinction matters for anyone — human or
agent — arriving later.

| # | Decision | Status |
|---|---|---|
| [0001](0001-monorepo-on-turborepo.md) | Monorepo on Turborepo and pnpm | accepted |
| [0002](0002-nextjs-app-router.md) | Next.js 16 with the App Router | accepted |
| [0003](0003-postgres-and-prisma-8.md) | PostgreSQL 18 with Prisma 8, accepting a pre-release dependency | accepted |
| [0004](0004-agent-docs-are-a-router.md) | Agent documentation is a router, not a copy | accepted |
| [0005](0005-language-policy.md) | English in code and docs, Polish in the product | accepted |
| [0006](0006-geo-seo-density-gated-pages.md) | Location pages start at voivodeship level and deepen by density | accepted |
| [0007](0007-prisma-owns-types-zod-guards-inputs.md) | Prisma owns output types, Zod guards inputs | accepted |
| [0008](0008-design-tokens-as-typescript.md) | Tailwind 4 and shadcn/ui in `packages/ui`, tokens as TypeScript | accepted |
| [0009](0009-tanstack-form-over-react-hook-form.md) | TanStack Form, not React Hook Form | accepted |
| [0010](0010-better-auth-owns-auth-tables.md) | Better Auth owns the auth tables; Prisma reads them as `external` | accepted |
| [0011](0011-i18n-with-next-intl.md) | next-intl with Polish as an unprefixed default | accepted |
| [0012](0012-data-access-boundary.md) | Data access boundary: domain functions, transport still open | **proposed** |
| [0013](0013-date-representation.md) | Date representation: Temporal with a polyfill, or text columns | **proposed** |
| [0014](0014-geospatial-storage.md) | Geospatial storage: plain coordinates or PostGIS | **proposed** |
| [0015](0015-image-storage.md) | Farm photo storage | **proposed** |
| [0016](0016-transport-independent-api.md) | The API is independent of its transport | accepted |
| [0017](0017-additive-only-api-procedures.md) | API procedures are additive only | accepted |

## The four open ones, and what unblocks them

| # | Waiting on |
|---|---|
| 0012 | A deliberate call between oRPC and tRPC. The domain-function layer underneath is common to both and is being built regardless. |
| 0013 | The first dated model (`Listing`). Cannot be deferred past it — Prisma 8 throws on the first read of a date column under Node 24. |
| 0014 | Building the map. Starting position is plain `lat`/`lng`, which is the reversible choice. |
| 0015 | Photo upload becoming a real task. Two requirements already hold: strip EXIF, and sit behind a transforming CDN. |
