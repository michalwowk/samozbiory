# 0009 — TanStack Form, not React Hook Form

- **Status:** accepted
- **Date:** 2026-09-26

## Context

Forms are the farmer-facing half of the product. The default pairing with shadcn/ui is React Hook Form,
because shadcn's `form` component *is* an RHF wrapper: `<Form>` is `FormProvider` and `<FormField>` is
`Controller`.

## Decision

`@tanstack/react-form@1.33.5`. It supports Standard Schema natively, so Zod 4 attaches directly via
`validators: { onChange: schema }` with **no resolver package** — `@hookform/resolvers` drops out.

The shadcn `form` component is therefore not used. Everything else from shadcn is
(`input`, `label`, `button`, `select`, `checkbox`, `textarea`, `dialog`, `command`, …), since only
`form` is coupled to RHF. A local `<Field>` wrapper in `packages/ui` (~40 lines: label, control, and
errors from `field.state.meta.errors`) replaces it.

## Consequences

- One fewer dependency than the RHF path.
- One file we own instead of one file shadcn owns — and it is a file we would have customised anyway.
- `packages/ui/AGENTS.md` must forbid `shadcn add form`. Running it silently reintroduces React Hook
  Form into the dependency tree, which is exactly what an agent will reach for when asked for a form.
