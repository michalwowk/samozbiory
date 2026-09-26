# 0001 — Monorepo on Turborepo and pnpm

- **Status:** accepted
- **Date:** 2026-09-26

## Context

The product is one main application, but it will need companion surfaces: campaign landing pages,
possibly a partner-facing page, later possibly a mobile client. Those have different release cadences
from the main app but must look like the same product. The thing we most need to share is visual
identity; logic sharing is secondary.

## Decision

A pnpm workspace driven by Turborepo. Applications live in `apps/*`, shared code in `packages/*`.

We deliberately do **not** create a package until a second consumer exists. In particular
`packages/core` is not created up front — a premature domain package is the most common way a
monorepo becomes unpleasant to work in.

## Consequences

- Landing pages deploy independently while importing the same design tokens.
- Every shared concern needs an explicit package boundary, which costs a `package.json` and an entry
  in the dependency graph. That cost is the point: it makes coupling visible.
- Turborepo caches per-package, so a change in `apps/marketing` cannot invalidate the main app's build.
