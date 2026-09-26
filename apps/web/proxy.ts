import createMiddleware from "next-intl/middleware";

import { routing } from "./i18n/routing";

/**
 * Next 16 renamed the `middleware` file convention to `proxy` — same functionality, new name. See
 * node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md. Do not recreate
 * `middleware.ts`; it still works but warns on every build.
 *
 * next-intl's factory is still called `createMiddleware`; only Next's file convention changed.
 */
export default createMiddleware(routing);

export const config = {
  // Skip Next internals, the API surface and anything with a file extension. Sitemap and robots are
  // excluded deliberately: they must never be locale-rewritten (ADR 0006).
  matcher: ["/((?!api|_next|_vercel|sitemap|robots|.*\..*).*)"],
};
