# 0004 — Agent documentation is a router, not a copy

- **Status:** accepted
- **Date:** 2026-09-26

## Context

This repository must be equally usable from Claude Code, Codex, Cursor or any other harness. Each one
reads a different entry file (`CLAUDE.md`, `AGENTS.md`, `GEMINI.md`), which is a trivial problem. The
real problem is the stack: Next 16, React 19, TypeScript 7, ESLint 10, Prisma 8, pnpm 12. **No model
has any of this in its training data.** An agent writing `prisma migrate dev` here produces a command
that does not exist.

Two dependencies already solve this for themselves, and we should copy their approach rather than
invent one:

- `next dev` writes a block into `apps/web/AGENTS.md` pointing at `apps/web/node_modules/next/dist/docs/`.
- Prisma 8 ships `skills/` inside its npm packages and states: *"This skill ships inside the installed
  Prisma packages, so it describes the exact version this project has — treat it as the source of
  truth over anything you remember about Prisma."*
- `prisma skills sync` mirrors those skills into `.claude/skills/`, `.cursor/skills/`,
  `.agents/skills/` and `.devin/skills/` — Prisma is already harness-agnostic on its own.

## Decision

1. `AGENTS.md` is canonical at every level. `CLAUDE.md` is a one-line pointer: `@AGENTS.md`.
2. `AGENTS.md` files **point at** documentation; they never restate it. Where a dependency documents
   itself inside `node_modules`, that path is the reference.
3. Procedural knowledge we own lives in `docs/guides/*.md` as plain Markdown, readable by any harness.
   Harness-specific skill directories may wrap those files but must not duplicate their content.
4. Vendored skill mirrors (`.claude/`, `.cursor/`, `.agents/`, `.devin/`) are **gitignored**.

## Consequences

- A copy of documentation lies about the version it describes; a pointer cannot. This is the whole
  rule, and it is why point 4 follows from point 2.
- `packages/database/node_modules/@prisma/orm-postgres/skills/prisma-8/SKILL.md` exists after `pnpm install` with no
  extra step, so correctness never depends on anyone remembering to run a sync.
- `pnpm skills:sync` is available for harnesses that auto-discover skill directories. It is a
  convenience on top, not the source of truth — the synced copy can go stale against a package bump,
  and the skill's own frontmatter tells the agent to compare `metadata.library_version` and re-sync.
- Vendored skills contain third-party `.ts` codemods. ESLint flat config does not read `.gitignore`,
  so `packages/config-eslint` must exclude those directories explicitly (it does; this was a real
  failure, caught by `pnpm lint` reporting 16 errors inside Prisma's own files).
