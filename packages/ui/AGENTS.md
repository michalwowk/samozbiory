# @repo/ui

The design system: Tailwind 4, shadcn/ui on Base UI primitives, and the design tokens every application
inherits. Repo-wide rules live in the root [`AGENTS.md`](../../AGENTS.md).

## Three rules, each overriding something your training data will suggest

### 1. Run `shadcn add` only from here

```sh
cd packages/ui && pnpm dlx shadcn@4.21.0 add dialog
```

Almost every shadcn example runs the CLI inside an application. In this monorepo that produces one copy
of `button.tsx` per app with palettes that quietly drift apart. There is exactly one `components.json`
and it lives in this package. Applications import `@repo/ui/components/<name>`
([ADR 0008](../../docs/decisions/0008-design-tokens-as-typescript.md)).

### 2. Never `shadcn add form`

shadcn's `form` component *is* a React Hook Form wrapper — `<Form>` is `FormProvider`, `<FormField>` is
`Controller`. Adding it drags React Hook Form back into the dependency tree, which this project
deliberately does not use.

Forms use **TanStack Form** with the local `<Field>` wrapper in this package
([ADR 0009](../../docs/decisions/0009-tanstack-form-over-react-hook-form.md)). Zod 4 attaches directly
through Standard Schema — `validators: { onChange: schema }`, with no resolver package.

`<Field>` deliberately knows nothing about a form instance, so it composes with any `form.Field` render
prop. It hands the control its a11y wiring rather than cloning children:

```tsx
<form.Field name="name">
  {(field) => (
    <Field label={t("name")} errors={field.state.meta.errors}>
      {(control) => (
        <Input
          {...control}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      )}
    </Field>
  )}
</form.Field>
```

Every *other* shadcn component is fine — `input`, `label`, `button`, `select`, `checkbox`, `textarea`,
`dialog`, `command` and the rest carry no RHF coupling.

### 3. `src/styles/theme.css` is generated — never edit it

```
src/tokens.ts  ──build:theme──>  src/styles/theme.css
```

Change a colour in `tokens.ts` and run `pnpm run build:theme`. Editing the CSS directly gets silently
reverted on the next build.

Tokens are authored as TypeScript rather than CSS for a reason that is not stylistic: shadcn components
are Tailwind, Base UI and `className`, all DOM, so they can **never** be shared with React Native. Tokens
can be — but only as data ([ADR 0016](../../docs/decisions/0016-transport-independent-api.md)).

In components, use the semantic classes (`bg-primary`, `text-muted-foreground`, `border-border`). Never
hard-code a colour, and never add a raw hex or `oklch()` to a component.

## What shadcn 4 actually looks like

This differs from older shadcn in ways worth knowing before you hand-write a component:

| | Here |
|---|---|
| Style | `base-nova` (preset `nova`, base `base` — shadcn 4's own default) |
| `cn` helper | the **`cn` npm package** — `src/lib/utils.ts` is just a re-export, not the old clsx + tailwind-merge pair |
| Primitives | **`@base-ui/react@1.8.0`** (`import { Button } from "@base-ui/react/button"`). Not Radix, and not the older `@base-ui-components/react`, which is still on a release candidate |
| Base CSS | `@import "shadcn/tailwind.css"` from the `shadcn` package, plus `tw-animate-css` |
| Tailwind config | none. Tailwind 4 is CSS-first; the theme is `@theme inline` in the generated CSS |
| Icons | `lucide-react` |

The `components.json` shape here was derived by running `shadcn init` in a throwaway project and reading
what it wrote — not from memory. Do the same if you need to change it.

## TypeScript 7

`baseUrl` was **removed** in TypeScript 7. Path aliases are declared as `paths` alone, resolved relative
to `tsconfig.json`. If you add a `baseUrl`, `tsc` fails with TS5102.

## Commands

```sh
pnpm run build:theme     # regenerate theme.css from tokens.ts
pnpm run lint
pnpm exec tsc --noEmit
```
