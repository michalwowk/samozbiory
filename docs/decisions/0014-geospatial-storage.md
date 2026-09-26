# 0014 — Geospatial storage: plain coordinates or PostGIS

- **Status:** proposed — revisited when the map is built
- **Date:** 2026-09-26

## Context

Farms are points on a map and proximity search is a core query. The received wisdom is that using
PostGIS with Prisma costs you type safety: in Prisma 6 and 7 a geography column surfaces as an
unsupported type and every query drops to raw SQL.

**That is not true of Prisma 8.** Its contract supports extension-namespaced types directly —
`postgis.Geometry(...)` alongside `pgvector.Vector(...)`, wired through the PostGIS extension's control
package. The main argument against PostGIS therefore does not apply here, which is why this decision is
genuinely open rather than settled by default.

## Options

1. **`Float lat` plus `Float lng`**, bounding-box prefilter on B-tree indexes, exact Haversine in the
   ordering clause. Fully typed, no extension, no image change. Poland has farms selling direct in the
   thousands, not millions; a bounding box plus Haversine over ~20k rows is single-digit milliseconds.
2. **PostGIS** via the Prisma 8 extension: a geography point type, radius predicates, proper spatial
   indexes. Requires switching `docker-compose.yml` to a PostGIS image.

## Interim position

Start with option 1, as the reversible choice, and keep `postgres:18.6` plain. Deferring this decision
*is* choosing the cheap reversible option, and that is recorded here so it reads as a decision rather
than an oversight.

Revisit when queries need polygons or isochrones (delivery areas, "within a 30-minute drive"), or when
point count approaches six figures.

**Geocoding is not purchased.** A farmer drags a pin on the map during registration, which is more
accurate than any geocoder on a rural address and costs nothing.
