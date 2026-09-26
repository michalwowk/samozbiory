import { expect, test } from "@playwright/test";

/**
 * The mandatory test of this project.
 *
 * Every other defect here announces itself — a broken query throws, a broken type fails to compile. The
 * density gate from ADR 0006 does not: if it stops working, thousands of empty location pages get
 * generated, nothing errors, and the penalty arrives months later as a ranking drop. So it gets an
 * end-to-end test that fails loudly.
 *
 * Seed data is shaped to make the gate observable: krakowski has six published farms, tatrzanski one,
 * nowosądecki none. See packages/database/src/seed.ts.
 */
test.describe("density gate (ADR 0006)", () => {
  test("a county above the threshold has a page", async ({ page }) => {
    const response = await page.goto("/samozbiory/malopolskie/krakowski");
    expect(response?.status()).toBe(200);
    await expect(page.locator("[data-farm-slug]")).not.toHaveCount(0);
  });

  test("a county below the threshold has no page", async ({ request }) => {
    // One published farm is not enough. This must 404 rather than render a near-empty page.
    const response = await request.get("/samozbiory/malopolskie/tatrzanski", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(404);
  });

  test("an empty county has no page", async ({ request }) => {
    const response = await request.get("/samozbiory/malopolskie/nowosadecki", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(404);
  });

  test("a below-threshold county is neither linked nor in the sitemap", async ({ page, request }) => {
    // A link or sitemap entry pointing at a 404 is worse than omitting it.
    await page.goto("/samozbiory/malopolskie");
    await expect(page.locator('a[href*="tatrzanski"]')).toHaveCount(0);

    const sitemap = await (await request.get("/sitemap/0.xml")).text();
    expect(sitemap).not.toContain("tatrzanski");
    expect(sitemap).toContain("/samozbiory/malopolskie/krakowski");
  });
});

test.describe("location pages are server-rendered (ADR 0006)", () => {
  test("the farm list is in the HTML, not hydrated in", async ({ request }) => {
    // Fetched without a browser: whatever is here is what a crawler sees.
    const html = await (await request.get("/samozbiory/malopolskie")).text();
    expect(html).toContain("data-farm-slug");
    expect(html).toContain('type="application/ld+json"');
  });

  test("JSON-LD describes real businesses with absolute URLs", async ({ request }) => {
    const html = await (await request.get("/samozbiory/malopolskie")).text();
    const match = html.match(/<script type="application\/ld\+json"[^>]*>(.*?)<\/script>/s);
    expect(match, "no JSON-LD block found").not.toBeNull();

    const graph = JSON.parse(match![1]!)["@graph"] as Array<Record<string, unknown>>;
    const itemList = graph.find((node) => node["@type"] === "ItemList");
    const breadcrumbs = graph.find((node) => node["@type"] === "BreadcrumbList");

    expect(itemList).toBeDefined();
    expect(breadcrumbs).toBeDefined();
    expect(itemList!.numberOfItems).toBeGreaterThan(0);

    const items = breadcrumbs!.itemListElement as Array<{ item: string }>;
    for (const crumb of items) expect(crumb.item).toMatch(/^https?:\/\//);
  });
});

test.describe("canonical URLs (ADR 0011)", () => {
  test("Polish serves unprefixed", async ({ request }) => {
    const response = await request.get("/samozbiory/malopolskie", { maxRedirects: 0 });
    expect(response.status()).toBe(200);
    expect(await response.text()).toContain('<html lang="pl"');
  });

  test("the prefixed form permanently redirects to the canonical one", async ({ request }) => {
    // Two URLs answering 200 would be duplicate content on every location page.
    const response = await request.get("/pl/samozbiory/malopolskie", {
      maxRedirects: 0,
      failOnStatusCode: false,
    });
    expect(response.status()).toBe(308);
    expect(response.headers()["location"]).toContain("/samozbiory/malopolskie");
  });

  test("robots.txt points at sitemap chunks that exist", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    const sitemapUrls = [...robots.matchAll(/^Sitemap:\s*(\S+)$/gim)].map((m) => m[1]!);
    expect(sitemapUrls.length).toBeGreaterThan(0);

    for (const url of sitemapUrls) {
      // generateSitemaps() serves /sitemap/<id>.xml and Next creates no index at /sitemap.xml.
      const response = await request.get(new URL(url).pathname);
      expect(response.status(), `${url} must not 404`).toBe(200);
    }
  });
});
