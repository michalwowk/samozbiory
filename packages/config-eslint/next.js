const nextPlugin = require("@next/eslint-plugin-next");
const prettierConfig = require("eslint-config-prettier");
const turboConfigModule = require("eslint-config-turbo/flat");
const tseslint = require("typescript-eslint");

const turboConfig = turboConfigModule.default ?? turboConfigModule;

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  ...tseslint.configs.recommended,
  {
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
  },
  ...turboConfig,
  prettierConfig,
  {
    // ADR 0012: applications never reach the database directly. Authorisation lives in @repo/api and
    // must exist in exactly one place — a Server Component that can call the ORM will eventually call
    // it without the ownership check. The rule has no exceptions: sitemap and generateStaticParams go
    // through ordinary functions in @repo/api, and Better Auth uses its own pg pool (ADR 0010).
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@repo/database", "@repo/database/*"],
              message:
                "Data access goes through @repo/api, never straight to the database. See docs/decisions/0012-data-access-boundary.md",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [
      // vendored agent skills (prisma skills sync) — third-party code, gitignored, not ours to lint
      "**/.claude/**",
      "**/.cursor/**",
      "**/.agents/**",
      "**/.devin/**",
      ".eslintrc.js",
      ".next/**",
      "next-env.d.ts",
      "node_modules/**",
    ],
  },
];
