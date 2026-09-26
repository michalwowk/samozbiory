"use client";

import { useId, type ReactNode } from "react";
import { cn } from "cn";

import { Label } from "./label";

/**
 * The replacement for shadcn's `form` component, which is a React Hook Form wrapper this project does
 * not use (ADR 0009). Deliberately knows nothing about a form instance, so it works with any
 * `form.Field` render prop and stays testable on its own.
 *
 * With a Standard Schema validator (Zod 4 attaches directly, no resolver package) TanStack Form reports
 * `field.state.meta.errors` as issue objects carrying `message`. Plain strings are accepted too, since a
 * hand-written validator may return one.
 */
type FieldIssue = string | { readonly message?: string } | null | undefined;

type ControlProps = {
  /** Wire onto the control so the label's `htmlFor` points at it. */
  id: string;
  /** Wire onto the control: shadcn styles `aria-invalid:` variants for you. */
  "aria-invalid": boolean;
  /** Wire onto the control so screen readers read the description and the error. */
  "aria-describedby": string | undefined;
};

export function Field({
  label,
  errors,
  description,
  className,
  children,
}: {
  label: string;
  errors?: ReadonlyArray<FieldIssue>;
  description?: string;
  className?: string;
  children: (control: ControlProps) => ReactNode;
}) {
  const base = useId();
  const controlId = `${base}-control`;
  const descriptionId = `${base}-description`;
  const errorId = `${base}-error`;

  const messages = (errors ?? [])
    .map((issue) => (typeof issue === "string" ? issue : issue?.message))
    .filter((message): message is string => Boolean(message));

  const invalid = messages.length > 0;
  const describedBy =
    [description ? descriptionId : undefined, invalid ? errorId : undefined]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={controlId}>{label}</Label>
      {children({ id: controlId, "aria-invalid": invalid, "aria-describedby": describedBy })}
      {description ? (
        <p id={descriptionId} className="text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
      {invalid ? (
        <p id={errorId} className="text-sm text-destructive">
          {messages.join(". ")}
        </p>
      ) : null}
    </div>
  );
}
