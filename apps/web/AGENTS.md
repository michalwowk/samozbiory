<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

The block above is written and re-added by `next dev`. Leave it alone: deleting it from a diff only
recreates the uncommitted change. Everything below is ours.

# apps/web

The application: farm directory, map, buyer and farmer panels, and the location pages that carry search
traffic. Repo-wide rules live in the root [`AGENTS.md`](../../AGENTS.md).

## Data access

**Never import `@repo/database` here.** ESLint fails the build on it. All reads and writes go through
`@repo/api`, which owns Zod input validation and authorisation
([ADR 0012](../../docs/decisions/0012-data-access-boundary.md)).

Server Components call `@repo/api` functions directly — in-process, typed, no HTTP. That is the default
and the cheapest path; reach for a network transport only when the browser itself must initiate the
request (map panning, filters without reload).

## Location pages are the product

A page under `/samozbiory/...` exists to be indexed, so:

- Its canonical content is a **server-rendered list** of farms plus `JSON-LD`. The map is a client
  component Google cannot execute — an enhancement, never the content.
- `generateStaticParams` reads `Region` from the database and emits only params that clear the density
  threshold. Pages below the threshold must not render empty; they 404
  ([ADR 0006](../../docs/decisions/0006-geo-seo-density-gated-pages.md)).
- URL shapes are fixed and must not be changed casually. Migrating indexed URLs is the most expensive
  mistake available in this project.

## Copy

Polish product copy lives in `messages/pl.json`, never as a string literal in a component. Polish is
the unprefixed default locale (`localePrefix: 'as-needed'`), so `/samozbiory/malopolskie` has no
`/pl/` segment and must not gain one ([ADR 0011](../../docs/decisions/0011-i18n-with-next-intl.md)).

## Forms

TanStack Form, not React Hook Form. **Do not run `shadcn add form`** — that component is an RHF wrapper
and adding it drags React Hook Form back into the tree. Use the `<Field>` wrapper from `@repo/ui`
([ADR 0009](../../docs/decisions/0009-tanstack-form-over-react-hook-form.md)).

Components come from `@repo/ui`. Run `shadcn add` only from `packages/ui`, never from here
([ADR 0008](../../docs/decisions/0008-design-tokens-as-typescript.md)).
