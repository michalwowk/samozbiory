const config = require("@repo/eslint-config/library.js");

/** @type {import("eslint").Linter.Config[]} */
module.exports = [
  ...config,
  {
    // Prisma writes a contract snapshot per migration hash. Generated third-party output, committed
    // because Prisma compares those hashes, but not ours to lint.
    ignores: ["migrations/snapshots/**"],
  },
  {
    rules: {
      "turbo/no-undeclared-env-vars": [
        "error",
        {
          allowList: ["NODE_ENV"],
        },
      ],
    },
  },
];
