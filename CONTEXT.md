# Domain model and vocabulary

The domain is Polish; the code is English ([ADR 0005](docs/decisions/0005-language-policy.md)). This
file is the **translation contract**. If a term is listed here, use exactly this English word in code —
do not coin a synonym.

## Glossary

| Polish | English | Notes |
|---|---|---|
| samozbiory | self-harvest | Picking produce yourself on the farm, paid by weight. No single-word English equivalent; the product name stays Polish, the code says `selfHarvest`. |
| gospodarstwo | **farm** | The business entity a farmer registers. Not "holding", not "household". |
| rolnik | **farmer** | The person. A `User` with a farm. |
| oferta | **listing** | One product available at one farm in one season. Not "offer" — that implies a price quote. |
| produkt | **product** | Strawberries, apples, lavender. A shared taxonomy, not free text. |
| zgłoszenie | **inquiry** | A buyer contacting a farm. Deliberately not "booking": there is no availability engine. |
| województwo | **voivodeship** | TERYT level 1. 16 of them. Always has a location page. |
| powiat | **county** | TERYT level 2. Page exists only above the density threshold. |
| gmina | **municipality** | TERYT level 3. Page exists only above the density threshold. |
| sezon | **season** | The window a listing is available, as a date range. |
| skup | purchase point | Not in scope yet; reserve the term rather than reusing `farm`. |

## Entities

```
User ──1:n──> Farm ──1:n──> Listing ──n:1──> Product
                │               │
                │               └── season: from / to
                ├── lat, lng    (a pin the farmer drags; no geocoding API — ADR 0014)
                └── regionId ──> Region
```

`Region` carries the TERYT hierarchy (voivodeship → county → municipality) seeded from GUS data. It is
not decoration: `generateStaticParams`, the sitemap, breadcrumbs and JSON-LD all read from it, and
without it no location page can be generated ([ADR 0006](docs/decisions/0006-geo-seo-density-gated-pages.md)).

`Inquiry` attaches to a `Farm` (optionally narrowed to a `Listing`). There is deliberately no
`Booking`, `Availability` or `Payment` entity — the product starts as a directory with contact, and the
model is shaped so an availability aggregate can be added later without reshaping what exists.

Authentication tables (`user`, `session`, `account`, `verification`) are **owned by Better Auth**, not
by this schema. They appear in the Prisma contract as `@@control(external)`: Prisma reads and types them
but never plans DDL for them ([ADR 0010](docs/decisions/0010-better-auth-owns-auth-tables.md)).

## Boundaries worth naming

- **A farm is not a user.** A farmer may register more than one farm; the ownership check is per farm.
- **A listing is not a price list.** It answers "is this available now, here", which is what a location
  page needs to render.
- **A region is not a coordinate.** Region drives URLs and SEO; `lat`/`lng` drive proximity search. A
  farm needs both and they are not derivable from each other in either direction.
