# 0006 — Location pages start at voivodeship level and deepen by density

- **Status:** accepted
- **Date:** 2026-09-26

## Context

Location pages are how this product is found. The tempting move is to generate every combination of
product and place, which is also the fastest way to get the whole domain penalised: 30 products across
2477 municipalities is ~75,000 pages, of which ~74,000 would be empty. Google treats that as thin or
doorway content.

The arithmetic decides the starting level. 200 farms across 16 voivodeships averages ~12 farms per
page — real content. The same 200 farms across 2477 municipalities averages 0.08.

## Decision

URL shapes are fixed now; **which pages exist is decided by data, not by us**:

```
/samozbiory/[voivodeship]                always — 16 pages from day one
/samozbiory/[voivodeship]/[county]       only when ≥5 farms
/[product]/[city]                        only when ≥3 farms within range
/gospodarstwo/[slug]                     always
```

`generateStaticParams` queries the database and emits only the params that clear the threshold. Pages
below the threshold do not exist — they 404 or redirect one level up. They are never rendered empty.

Every location page renders a server-side **list** of farms plus `JSON-LD` as its canonical content.
The map is a client component that Google cannot execute, so it is an enhancement, never the content.

## Consequences

- Deeper levels appear on their own as density grows. The decision is never revisited and URLs never
  migrate — the most expensive thing to get wrong in SEO.
- Requires a `Region` table with the TERYT hierarchy (voivodeship → county → municipality), seeded
  from GUS data. Without it there is no `generateStaticParams`, no sitemap, no breadcrumbs, no JSON-LD.
- Implementation order is inverted from the intuitive one: **the list ships before the map.**
- The threshold is invisible when broken — nothing fails, pages just quietly become worthless. It is
  therefore covered by a mandatory end-to-end test asserting a below-threshold page returns 404.
