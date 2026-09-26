# 0011 — next-intl with Polish as an unprefixed default

- **Status:** accepted
- **Date:** 2026-09-26

## Context

The product is Polish and has no second locale planned. The routing choice is nonetheless an SEO
decision, not a translation one, because it determines the shape of every location URL.

## Decision

`next-intl@4.14.7` with `localePrefix: 'as-needed'`: Polish serves unprefixed
(`/samozbiory/malopolskie`), any future locale is prefixed (`/en/...`).

Messages live in `apps/web/messages/pl.json` — **not** in a shared package.

## Consequences

- Installed from day one despite having one locale. Extracting hard-coded strings from sixty components
  later is only cheap in theory.
- Application copy and marketing copy have different lifecycles; a shared i18n package would force them
  into one file. Messages move to `packages/i18n` when a mobile client needs the same strings, and not
  before.
- Going from `always` to `as-needed` later would mean a mass redirect migration across every location
  page. Choosing `as-needed` now avoids a migration we would certainly regret.
