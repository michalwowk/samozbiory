import { defineConfig } from "@playwright/test";

/**
 * The suite runs against a production build, not `next dev`. The thing under test is
 * `generateStaticParams` and the density gate (ADR 0006), and those only behave realistically once
 * pages are actually prerendered.
 *
 * Assumes the database is up and seeded: `docker compose up -d && pnpm db:push && pnpm db:seed`.
 */
const PORT = 3210;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: { baseURL: `http://localhost:${PORT}` },
  webServer: {
    command: `pnpm run build && pnpm run start --port ${PORT}`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
