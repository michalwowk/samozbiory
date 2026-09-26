# 0013 — Date representation: Temporal with a polyfill, or text columns

- **Status:** proposed — decided when the first dated model lands (`Listing`)
- **Date:** 2026-09-26

## Context

Prisma 8 on PostgreSQL reads and writes **`Temporal`** values for `Date`, `Timestamp(p)`,
`Timestamptz(p)` and `Time(p)` — never JavaScript `Date`. From the shipped `references/contract.md`:

> They need a global `Temporal` at query time: Node.js 26.8.2 and later ship `globalThis.Temporal`;
> 26.8.1 and earlier — including every 22 and 24 release — do not, and the first read or write of such
> a column throws `RUNTIME.TEMPORAL_UNAVAILABLE`.

This repository pins `node >=24.21.0`, and Node 26 does not become LTS until October 2026. The starter's
`emailVerified DateTime?` field already emits the `pg/timestamptz-temporal@1` codec, so the defect is
latent in the repository today rather than hypothetical.

Seasonality is domain logic here — "strawberries from 15 June to 10 July" drives which farms appear on
every page load — so this is a whole-schema decision, not a per-field one.

## Options

1. **`temporal-polyfill@1.0.5`** plus a global import in `packages/database/src/client.ts`, before the
   first query. Columns stay `Date` and `Timestamptz`. Prisma names this as the supported route for
   Node 22 and 24. Removed when Node 26 becomes LTS: one import and one dependency, no code changes.
2. **`DateString` / `TimestamptzString` columns.** No extra dependency, but dates become strings and
   comparisons plus timezone handling become ours. Parsing a bare date string yields UTC midnight, and
   nothing in the type system distinguishes a date string from a timestamp string.
3. **Node 26.8.2 or later now.** `Temporal` is built in, but this breaks the released-versions-only
   policy for a second dependency, which ADR 0003 scoped to Prisma alone.

## Recommendation

Option 1. Storing seasons as strings in an application whose purpose is seasonality invites exactly the
comparison and timezone bugs the type system should be preventing.

If option 1 is taken, one rule follows and must be documented in `packages/api/AGENTS.md`:
**`Temporal` values never cross the RSC boundary.** React serialises `Date` but not class instances, so
anything reaching a client component is converted to a string first. This also keeps the polyfill out of
the browser bundle, since date arithmetic stays on the server.

A second consequence: shadcn's `Calendar` (react-day-picker) works in `Date`, so the farmer's season
picker converts once at the UI boundary.
