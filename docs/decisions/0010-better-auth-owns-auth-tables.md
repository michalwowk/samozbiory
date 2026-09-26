# 0010 — Better Auth owns the auth tables; Prisma reads them as `external`

- **Status:** accepted (implementation deferred)
- **Date:** 2026-09-26

## Context

This is a two-sided marketplace with farmers and buyers, and farmer accounts are the core business
asset. `User` sits in the middle of the domain graph (`User → Farm → Listing → Inquiry`), not at its
edge, so every meaningful query joins it.

**Better Auth 1.7.6 does not support Prisma 8.** Its peer dependencies declare
`prisma: ^5 || ^6 || ^7` and `@prisma/client: ^5 || ^6 || ^7`, and Prisma 8 has no `@prisma/client` at
all — `@better-auth/prisma-adapter` is unusable here. This only became visible once ADR 0003 and the
choice of Better Auth were put side by side.

Prisma 8 has a mechanism for exactly this situation. `@@control(<policy>)` takes
`managed | tolerated | external | observed` and controls whether Prisma plans DDL for a table. The
official `@internal/extension-supabase` uses it to expose Supabase's `auth` and `storage` schemas as
external tables.

## Decision

Better Auth on `@better-auth/kysely-adapter` over its own `pg` pool, owning the DDL for its tables.
Those tables are declared in the Prisma contract with `@@control(external)`, so Prisma never migrates
them but does type and read them.

Auth **implementation** is deferred to the tasks that need it. The orphan `model User` inherited from
the starter template is removed before then, so it cannot collide with Better Auth's `user` table.

## Consequences

- Each tool owns what it is good at: Better Auth owns auth DDL, Prisma owns reads. No webhook sync, no
  per-MAU cost, and `User → Farm → Listing` stays typed in a single query.
- Better Auth does not use `@repo/database`, which is why the import ban in ADR 0012 needs no exception.
- `@better-auth/expo@1.7.6` exists and ships in lockstep with `better-auth`, so this decision extends
  to a mobile client unchanged.
- Session strategy must admit bearer tokens, not only cookies — React Native has no cookie jar in the
  browser sense (ADR 0016).
- Rejected: Clerk 7.9.7 would be faster to ship but puts the user table behind a sync boundary, at the
  exact point where we claim end-to-end typing. Reasonable if time-to-production dominates; it does not.
