const prettierConfig = require("eslint-config-prettier");
const turboConfigModule = require("eslint-config-turbo/flat");
const tseslint = require("typescript-eslint");

const turboConfig = turboConfigModule.default ?? turboConfigModule;

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  ...tseslint.configs.recommended,
  ...turboConfig,
  prettierConfig,
  {
    ignores: [
      // vendored agent skills (prisma skills sync) — third-party code, gitignored, not ours to lint
      "**/.claude/**",
      "**/.cursor/**",
      "**/.agents/**",
      "**/.devin/**",
      ".eslintrc.js",
      "dist/**",
      "generated/**",
      "node_modules/**",
    ],
  },
];
