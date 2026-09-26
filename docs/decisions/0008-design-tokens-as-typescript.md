# 0008 — Tailwind 4 and shadcn/ui in `packages/ui`, tokens authored as TypeScript

- **Status:** accepted
- **Date:** 2026-09-26

## Context

Sharing visual identity between the main app and marketing pages is the primary reason this repo is a
monorepo. `packages/ui` existed as an empty directory with no `package.json`.

Two mechanics needed deciding. First, where `shadcn add` writes: the overwhelming majority of examples
run it inside an application, which in a monorepo produces one copy of `button.tsx` per app with
palettes that drift apart. Second, the token format — and that one reaches further than it looks. If a
React Native client is ever built, **shadcn components can never be shared with it**: Tailwind, Base UI
and `className` are DOM. Tokens *can* be shared, but only if they are data rather than hand-written CSS.

## Decision

- One `components.json`, in `packages/ui`. `shadcn add` is run **only** from there; applications
  consume `@repo/ui/components/*`.
- Tokens live in `packages/ui` (not a separate package) and are **authored as TypeScript** in
  `src/tokens.ts`. The Tailwind 4 `@theme` block in `styles/theme.css` is **generated** from them.
- Primitives are **Base UI** (`@base-ui/react@1.8.0`), which is shadcn 4's own default. It is generally
  available on a single `latest` tag, so it needs no exception to the released-versions-only policy —
  unlike the older `@base-ui-components/react`, which is still a release candidate.
- The shadcn `form` component is not used — see ADR 0009.

## Consequences

- Extracting tokens to `packages/tokens` later is a file move. Rewriting hand-authored CSS is a hunt
  for where the palette diverged.
- Decouples us from an open question: `nativewind@4.2.7` declares a peer of `tailwindcss >3.3.0`, which
  formally admits Tailwind 4, but its support for CSS-first `@theme` is unverified. Tokens-as-data means
  that answer does not gate anything.
- Base UI is newer than Radix and far less represented in model training data. That cost is bounded
  here: shadcn copies components **into this repository**, so an agent reads the actual primitive from
  our own source rather than recalling it. Reversing the choice means re-adding components, which is
  cheap now and expensive once the component set has grown.
- `packages/ui/AGENTS.md` must state the `shadcn add` rule explicitly. An agent asked to "add a dialog"
  will otherwise run the command in the app directory, because that is what its training data shows.
