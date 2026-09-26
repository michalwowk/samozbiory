# 0012 — Data access boundary: domain functions, with the transport still open

- **Status:** proposed
- **Date:** 2026-09-26

## Context

Prisma's own marketing claims type safety "from the database to your React components", and within a
single process that is literally true — a Server Component *is* a React component running next to
Prisma. Types break only when the browser initiates its own request. Server Actions also cross that
boundary typed, so an RPC layer is **not** required for type safety on the web.

Counting where data is actually needed:

| Need | Typed by | Network API required? |
|---|---|---|
| Location pages, `generateMetadata`, `generateStaticParams`, `sitemap.ts` | Prisma + Server Components | no |
| Farmer editing a farm via a form | Server Actions | no |
| Map panning, filters without reload, autocomplete | nothing | **yes** |
| Future public API for partners and aggregators | nothing | **yes** |
| A mobile client | nothing | **yes** — see ADR 0016 |

What remains open is only the transport. Three candidates:

1. **Plain functions plus one Route Handler.** Zero new dependencies. The client type is a hand-written
   annotation that TypeScript trusts but does not verify, so a shape change in the handler compiles
   cleanly and is wrong at runtime.
2. **oRPC 1.15.4 over the same functions.** The client type is inferred, so drift is a compile error.
   `@orpc/openapi` yields REST and OpenAPI from the same router. Four new packages.
3. **tRPC 11.19.0.** Same architecture as option 2, more mature and better represented in model
   training data, but the REST/OpenAPI layer must be written by hand.

Option 1 is **excluded** by any plan to build a mobile client: it offers no path to one without adding
a whole API layer from scratch.

## Decision (partial, and deliberately so)

`packages/api` exports **plain async functions** — Zod-validated input, authorisation inside, Prisma
underneath (`searchFarms`, `farmBySlug`, `regionTree`). This layer is common to all three options; an
RPC router would be a one-line-per-procedure wrapper over it, holding no logic.

The transport choice between options 2 and 3 is open.

Independent of the transport, one invariant is settled and **machine-enforced**, not merely documented:
`apps/*` may not import `@repo/database`. The rule lives in `packages/config-eslint` as a
`no-restricted-imports` pattern and fails the build, not a review.

## Consequences

- In a two-sided marketplace, authorisation is the one thing that must not be duplicated. "A farmer may
  only edit their own farm" lives in one place. If a Server Component can reach the ORM's update path,
  eventually one will, without the ownership check.
- The import rule needs **no exceptions**: sitemap and `generateStaticParams` are served by ordinary
  functions in `api`, and Better Auth runs on its own `pg` pool rather than `@repo/database` (ADR 0010).
- Keeping logic in functions rather than in procedures is what makes the transport decision reversible:
  adopting or dropping RPC touches the client call site and the handler, roughly two files, and no logic.
- Functions are testable without HTTP, React, or a running Next.js server.
