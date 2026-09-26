import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "./i18n/routing";

/**
 * Next 16 renamed the `middleware` file convention to `proxy` — same functionality, new name. See
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md. Do not recreate
 * `middleware.ts`; it still works but warns on every build.
 *
 * next-intl's factory is still called `createMiddleware`; only Next's file convention changed.
 */
const intl = createMiddleware(routing);

/**
 * Paths that must never be locale-rewritten. `sitemap` and `robots` in particular: a rewritten
 * `/sitemap/0.xml` 404s, which would point crawlers at nothing (ADR 0006).
 *
 * This lives in code rather than in the matcher on purpose. A matcher of the documented shape
 * `/((?!a|b|.*\..*).*)` silently failed to match nested paths here — `/` was rewritten but
 * `/samozbiory/malopolskie` was not, so every location page 404ed behind a perfectly green build. The
 * matcher below is kept to the simplest form that demonstrably works, and the rest is an explicit,
 * testable check.
 */
const NEVER_LOCALISED = /^\/(?:api|sitemap|robots|favicon)(?:[/.]|$)|\.[a-z0-9]+$/i;

export default function proxy(request: NextRequest) {
  if (NEVER_LOCALISED.test(request.nextUrl.pathname)) return NextResponse.next();
  return intl(request);
}

export const config = {
  matcher: ["/((?!_next|_vercel).*)"],
};
