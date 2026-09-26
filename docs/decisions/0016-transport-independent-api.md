# 0016 — The API is independent of its transport

- **Status:** accepted
- **Date:** 2026-09-26

## Context

A mobile client cannot call a Server Component or a Server Action — those are React and Next.js
transports that only exist in a browser. A mobile app requires a real, typed network API, which is why
it eliminates the "plain functions only" option in ADR 0012.

The question is whether that implies a separate backend service. It does not — but it does require the
API not to be welded to the web application. If the router lives inside `apps/web/app/api/`, the mobile
client depends on the web app's deploy.

## Decision

The router lives in `packages/api`. Applications **mount** it; they do not contain it.

Consumers and their transports:

| Consumer | Transport | Types from |
|---|---|---|
| `apps/web` Server Components | in-process call, no HTTP | inference |
| `apps/web` client (map, filters) | RPC over HTTP | inference |
| a future `apps/mobile` (Expo) | RPC over HTTP | inference |
| partners, aggregators, non-TypeScript callers | REST plus OpenAPI | OpenAPI schema |

A mobile client written in React Native is a TypeScript consumer, so RPC serves it and REST would throw
the types away. REST is for consumers whose compiler we do not know.

**We do not build a separate BFF.** An RPC router with per-consumer procedures already is one: when
mobile needs a different payload shape, that is a `mobile.farms.search` procedure on the same router. A
standalone BFF earns its place with divergent deploy cadences, a separate team, a different scaling
profile, or a non-JS consumer with its own SLA. None of those hold, and each adds a deploy, monitoring,
and a boundary across which types stop flowing on their own.

## Consequences

- Splitting the API into `apps/api` later means adding a file with a Node or Fastify adapter — not a
  refactor, because logic never lived in Next.js.
- Trigger for actually doing that split: web and mobile deploy cadences diverging.
- Rate limiting and observability belong in router middleware, and become necessary as soon as the API
  is public or mobile.
- Sharing does not extend to components. `packages/ui` is Tailwind, Base UI and `className`, all of which
  are DOM; React Native can share **tokens** (ADR 0008) and domain logic, never components.
