# Keeping the agent documentation honest

This repository is meant to be equally workable from Claude Code, Codex, Cursor or anything else that
reads `AGENTS.md`. The decision is [ADR 0004](../decisions/0004-agent-docs-are-a-router.md); this guide
is how to maintain it without letting it rot.

## The one rule

**Point at documentation. Never copy it.**

A copy states a version. The moment the package bumps, the copy is wrong and nothing tells you — it just
keeps confidently describing a version you no longer have. A pointer cannot go stale that way.

This is not our invention. Both major dependencies already do it:

- `next dev` writes a block into `apps/web/AGENTS.md` pointing at `apps/web/node_modules/next/dist/docs/` (spelled package-relative in that file).
- Prisma 8 ships a full skill inside its npm package and says, in that skill: *treat it as the source of
  truth over anything you remember about Prisma.*

So when you are tempted to write "here is how Prisma migrations work" into a file in this repo: don't.
Write the path, and write the repo-specific part that the vendor's docs cannot know.

## File layout

| File | Role |
|---|---|
| `AGENTS.md` | canonical, at the repo root and in every package |
| `CLAUDE.md` | one line: `@AGENTS.md`. Never edit it; never let the two diverge |
| `CONTEXT.md` | domain model and the PL↔EN glossary |
| `docs/decisions/` | ADRs — why, not how |
| `docs/guides/` | procedures we own, as plain Markdown any harness can read |

Harness-specific skill directories (`.claude/skills/`, `.cursor/skills/`, `.agents/skills/`,
`.devin/skills/`) are **gitignored**. They are populated by `pnpm skills:sync`, which copies skills out
of installed packages. A committed copy would drift from the package version — the exact failure this
whole scheme avoids.

## When you add a package

1. Create `packages/<name>/AGENTS.md`. Cover what is **specific to that package**; link to the root
   `AGENTS.md` for repo-wide rules instead of restating them.
2. Create `packages/<name>/CLAUDE.md` containing exactly `@AGENTS.md`.
3. If the package's main dependency ships its own docs inside `node_modules`, name that path.
   pnpm does not hoist to the root, so verify the path resolves from where you wrote it — a
   pointer that 404s is worse than no pointer, and this exact mistake was made once already.

## What belongs in an `AGENTS.md`

Write down the things an agent will otherwise get wrong **because its training data says otherwise**.
That is the filter. Each existing rule earns its place that way:

| Rule | The default it overrides |
|---|---|
| Run `shadcn add` only from `packages/ui` | 95% of examples run it inside an app |
| Do not use shadcn's `form` component | it is the documented way to build a form with shadcn |
| `prisma contract emit`, not `prisma generate` | every Prisma tutorial ever written |
| Location pages render a list, not a map | a map feels like the obvious primary UI |
| `apps/*` must not import `@repo/database` | querying from a Server Component is idiomatic Next.js |

A rule that merely restates good practice is noise. A rule that contradicts a strong prior is worth its
line.

## Prefer enforcement over prose

Where a rule can fail a build, make it fail a build. The database import ban is a
`no-restricted-imports` pattern in `packages/config-eslint/next.js`, not just a paragraph — and it
immediately caught a real violation in the starter's home page, which had been querying the database
directly from a Server Component.

Documentation is for the rules you cannot enforce. Keep that set small.

## Checking it still works

```sh
pnpm check:docs                                           # every node_modules pointer resolves
pnpm skills:sync                                          # refresh vendored skills
ls packages/database/node_modules/@prisma/orm-postgres/skills/prisma-8/references/  # 15 files
find . -path '*/skills/*' -type d -empty -not -path '*/node_modules/*'   # nothing
git status --short                                        # no skill file ever staged
```

That third command matters: this repo previously contained a skill directory of **40+ folders and zero
files**. An agent saw "the skill exists", found nothing, and fell back to its training data — worse than
having no skill at all.
