# samozbiory

A directory of Polish farms selling directly to consumers. Farmers put themselves on the map and
publish what they have in season; buyers find them by location and contact them. The point is to
shorten the supply chain between a field and a kitchen.

Search traffic is the distribution mechanism, not an afterthought — location pages are the product.

## Stack

| Layer | Choice | Why |
|---|---|---|
| App | Next.js 16 (App Router) | server-rendered location pages are the SEO surface |
| Database | PostgreSQL 18 + Prisma 8 | contract-first, and it ships its own agent documentation |
| Validation | Zod 4 | guards inputs; Prisma owns output types |
| Styling | Tailwind 4 + shadcn/ui | design tokens live in `@repo/ui` |
| Forms | TanStack Form | Standard Schema, so Zod plugs in without a resolver package |
| Monorepo | Turborepo + pnpm | one app plus marketing pages, sharing tokens and logic |

Decisions and their rationale live in [`docs/decisions/`](./docs/decisions). Read
[`CONTEXT.md`](./CONTEXT.md) for the domain model and the Polish↔English glossary.

## Getting started

### 1. Configure the environment

```sh
cp .env.example .env                      # docker compose reads this
cp .env.example packages/database/.env    # keep DATABASE_URL in sync with the values above
cp .env.example apps/web/.env
```

`docker-compose.yml` substitutes `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` from the root
`.env` and fails loudly if any is missing, so the running database always matches what you declared.

### 2. Start PostgreSQL

```sh
docker compose up -d
```

The service has a healthcheck, so the next step will not race `initdb`.

### 3. Install and emit the data contract

```sh
pnpm install
pnpm generate        # prisma contract emit → generated/contract.json + contract.d.ts
pnpm db:push         # prisma db update — applies the contract to a dev database
pnpm db:seed
```

### 4. Run

```sh
pnpm dev
```

## Tests

```sh
pnpm test        # unit tests
pnpm test:e2e    # end-to-end; builds the app and needs a seeded database
```

The end-to-end suite guards the density gate that decides which location pages exist. That gate fails
silently — nothing throws, pages simply become worthless — so the suite is not optional. See
[ADR 0006](./docs/decisions/0006-geo-seo-density-gated-pages.md).

## Working on the database

**Prisma 8 is not the Prisma you know.** There is no `prisma generate`, no `prisma migrate dev`, and no
`@prisma/client`. You edit a *data contract* and the framework derives types and migrations from it.

| Task | Command |
|---|---|
| Re-emit contract artifacts | `pnpm generate` |
| Apply contract changes in dev | `pnpm db:push` |
| Plan a committed migration | `pnpm --filter @repo/database exec prisma migration plan` |
| Apply committed migrations | `pnpm db:migrate:deploy` |
| Format the contract | `pnpm --filter @repo/database run format` |

There is no first-party Next.js plugin for contract emit (only Vite has one), so `prebuild` and
`predev` run the emit for you. Editing the contract while `next dev` is running needs a manual
`pnpm generate`.

## Documentation for coding agents

Every package carries an `AGENTS.md`, with `CLAUDE.md` as a one-line pointer to it, so the same
instructions work under Claude Code, Codex, Cursor and anything else that reads `AGENTS.md`.

Those files deliberately **point at documentation instead of restating it**: a copy drifts from the
installed version, a pointer cannot. Next.js documents itself under `apps/web/node_modules/next/dist/docs/`,
and Prisma 8 ships a full skill under `packages/database/node_modules/@prisma/orm-postgres/skills/prisma-8/`.

```sh
pnpm skills:sync     # mirrors package-provided skills into .claude/ .cursor/ .agents/ .devin/
```

Those mirrors are gitignored on purpose — see [ADR 0004](./docs/decisions/0004-agent-docs-are-a-router.md).
