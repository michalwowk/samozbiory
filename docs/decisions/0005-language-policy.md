# 0005 — English in code and docs, Polish in the product

- **Status:** accepted
- **Date:** 2026-09-26

## Context

The domain is Polish and some of it does not survive translation: *samozbiory* is a specific practice
(you pick it yourself, on the farm, paying by weight) with no one-word English equivalent. Three
coherent options existed: Polish identifiers throughout, English throughout with a glossary, or
English code with Polish docs.

## Decision

- **Code identifiers and comments: English.** `farm.listings`, not `gospodarstwo.oferty`.
- **Repository documentation (ADRs, guides, AGENTS.md): English.**
- **Product UI: Polish** (`pl-PL`), via next-intl — see ADR 0011.
- **Business documents: Polish, and stored outside this repository.**
- `CONTEXT.md` holds a bidirectional PL↔EN glossary and is the contract for translating domain terms.

## Consequences

- An agent reading `farm.listings` needs no context; one reading `gospodarstwo.oferty` guesses.
- Every domain term must be translated once, deliberately, in `CONTEXT.md`. Ambiguity is resolved
  there rather than argued about in code review.
- Polish product copy never appears as a literal in a component — it lives in `messages/pl.json`, so
  the code stays English even where the product is not.
