# 0002 — Next.js 16 with the App Router

- **Status:** accepted
- **Date:** 2026-09-26

## Context

Location pages are the distribution mechanism for this product: a user searching for
"samozbiór truskawek małopolska" must land on a page that already contains the answer in its HTML.
That makes server rendering a functional requirement, not a performance preference.

## Decision

Next.js 16, App Router, React Server Components as the default. Interactive islands (the map,
filters) are client components.

## Consequences

- Server Components can query the database in-process, with types, and no network hop.
- Server Components and Server Actions are **browser-only transports**. They do not extend to a
  mobile client — see ADR 0016.
- `apps/web/AGENTS.md` carries a machine-generated block (`<!-- BEGIN:nextjs-agent-rules -->`) written
  by `next dev`, pointing at `apps/web/node_modules/next/dist/docs/`. Our own rules go *below* it; the block is
  regenerated on every `next dev` and must not be deleted.
