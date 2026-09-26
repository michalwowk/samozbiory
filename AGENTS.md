# samozbiory — repository guide

A directory of Polish farms selling directly to consumers. Farmers put themselves on a map and publish
what they have in season; buyers find them by location and contact them. Search traffic is the
distribution mechanism, so **location pages are the product**, not a marketing surface.

## Read this first: the stack is newer than your training data

Next 16.3.6 · React 19.3 · TypeScript 7.0.2 · ESLint 10.11 · Prisma 8.0.0-rc.17 · pnpm 12.6 · Node 24.

APIs and commands you remember are likely wrong here. The two dependencies that changed most **ship
their own documentation inside `node_modules`** — read it rather than recalling it:

| Topic | Read |
|---|---|
| Next.js 16 | `apps/web/node_modules/next/dist/docs/` |
| Prisma 8 | `packages/database/node_modules/@prisma/orm-postgres/skills/prisma-8/SKILL.md` plus its `references/` |

pnpm does not hoist these to the root `node_modules` — the paths above are repo-root-relative and both
resolve. A path spelled `node_modules/...` inside a package's own `AGENTS.md` resolves from that
package's directory, which is the convention Next.js itself uses.

Prisma 8 is the biggest trap. There is no `@prisma/client`, no `generator` block, no `prisma generate`
and no `prisma migrate dev`. See [`docs/guides/database.md`](docs/guides/database.md).

`pnpm skills:sync` mirrors package-provided skills into `.claude/`, `.cursor/`, `.agents/` and
`.devin/`. Those mirrors are gitignored; `node_modules` is the source of truth ([ADR 0004](docs/decisions/0004-agent-docs-are-a-router.md)).

## Rules that are not negotiable

1. **`apps/*` must never import `@repo/database`.** All data access goes through `@repo/api`.
   Enforced by ESLint, so it fails `pnpm lint` rather than review. Authorisation lives in `@repo/api`
   and must not be duplicated ([ADR 0012](docs/decisions/0012-data-access-boundary.md)).
2. **Documentation points; it does not copy.** Never summarise `node_modules` docs into a file here — a
   copy drifts from the installed version and starts lying silently.
3. **Code and documentation in English; product copy in Polish**, via `messages/pl.json`. Never a Polish
   string literal in a component ([ADR 0005](docs/decisions/0005-language-policy.md)).
4. **Location pages render a server-side list as their canonical content.** The map is a client
   component Google cannot execute, so it is an enhancement, never the content
   ([ADR 0006](docs/decisions/0006-geo-seo-density-gated-pages.md)).
5. **Do not create a package speculatively.** `packages/core` does not exist until a second consumer or
   a test forces it.
6. **API procedures change additively only.** A breaking change is a new procedure
   ([ADR 0017](docs/decisions/0017-additive-only-api-procedures.md)).

## Layout

```
apps/web              the application: directory, map, buyer and farmer panels, SEO
packages/database     Prisma 8 contract and client   ← only @repo/api may import this
packages/api          domain functions: Zod input, authorisation, Prisma underneath
packages/ui           Tailwind 4 + shadcn/ui, design tokens authored as TypeScript
packages/config-*     shared eslint and typescript configuration
docs/decisions        ADRs — read these before changing an architectural choice
docs/guides           procedures we own, as plain Markdown any harness can read
```

Each package carries its own `AGENTS.md` with rules specific to it. `CLAUDE.md` is always a one-line
pointer to the sibling `AGENTS.md`; keep both in sync by never editing `CLAUDE.md`.

## Commands

```sh
pnpm dev                 # all apps
pnpm lint                # includes the @repo/database import ban
pnpm check:docs          # every node_modules pointer in the docs still resolves
pnpm generate            # prisma contract emit → generated/contract.{json,d.ts}
pnpm db:push             # prisma db update — apply the contract to a dev database
pnpm db:seed
pnpm skills:sync         # refresh vendored agent skills after a Prisma bump
```

## Domain vocabulary

Domain terms are translated once, deliberately, in [`CONTEXT.md`](CONTEXT.md). Use the English side in
code; do not invent a second translation for a term already listed there.
