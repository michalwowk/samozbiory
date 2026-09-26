# Location pages and search

Search traffic is how this product is found, so location pages are load-bearing infrastructure rather
than content. The decision behind this guide is
[ADR 0006](../decisions/0006-geo-seo-density-gated-pages.md); what follows is how to work with it.

## The failure mode this design prevents

Generating every product-by-place combination gives ~75,000 pages from 30 products and 2477
municipalities, of which ~74,000 would be empty. Google classifies that as thin or doorway content and
can penalise the whole domain. Google does not penalise having few pages; it penalises having empty ones.

## URL shapes are fixed

```
/samozbiory/[voivodeship]              always — 16 pages
/samozbiory/[voivodeship]/[county]     only when ≥5 farms
/[product]/[city]                      only when ≥3 farms within range
/gospodarstwo/[slug]                   always
```

Deeper levels appear **on their own** as density grows, because `generateStaticParams` queries the
database and emits only params clearing the threshold. Nobody re-decides this later, and indexed URLs
never migrate — the most expensive mistake available here.

A page below its threshold must not render empty. It 404s, or redirects one level up.

## Every location page needs four things

1. **A server-rendered list of farms.** This is the canonical content. The map is a client component
   that Google cannot execute, so it never counts as content. Build the list first, the map second.
2. **`JSON-LD`** — `LocalBusiness` per farm, plus `BreadcrumbList`.
3. **`generateMetadata`** with a title and description naming the actual place.
4. **A breadcrumb trail** matching the URL hierarchy.

## Sitemap

`app/sitemap.ts` with `generateSitemaps()`. The 50,000-URL-per-file limit is real and will be reached
once county and product pages open up, so chunking is required from the start rather than retrofitted.

Only emit URLs for pages that actually exist. A sitemap listing a 404 is worse than omitting the entry.

## Testing this

The threshold is **invisible when broken**: nothing throws, pages simply become worthless, and you find
out when rankings drop months later. It therefore has a mandatory end-to-end test asserting that a
below-threshold location page returns 404.

```sh
curl -s localhost:3000/samozbiory/malopolskie | grep -c 'application/ld+json'   # ≥1
curl -s -o /dev/null -w '%{http_code}' localhost:3000/samozbiory/malopolskie/<sparse-county>   # 404
```

Treat that second command as the canary for this entire guide.
