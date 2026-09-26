import { Button } from "@repo/ui/components/button";

// Placeholder that exercises the full styling pipeline: tokens.ts -> theme.css -> Tailwind -> here.
// The real home page arrives with the location pages, reading through @repo/api (ADR 0012).
export default function IndexPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col justify-center gap-6 p-8">
      <h1 className="text-4xl font-semibold tracking-tight text-foreground">samozbiory</h1>
      <p className="text-muted-foreground">
        Foundation in place. Location pages are next.
      </p>
      <div className="flex gap-3">
        <Button>Primary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="secondary">Secondary</Button>
      </div>
    </main>
  );
}
