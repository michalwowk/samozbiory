import { describe, expect, it } from "vitest";

import { DENSITY_THRESHOLD, meetsThreshold } from "./thresholds";

/**
 * The density gate is the one piece of this project whose failure is **invisible** — nothing throws,
 * location pages just quietly become worthless and rankings drop months later (ADR 0006).
 *
 * These are unit tests over the pure gate. The end-to-end test in `apps/web/e2e` covers the other half:
 * that a below-threshold page actually 404s in a running server.
 */
describe("meetsThreshold", () => {
  it("always admits a voivodeship — all 16 pages exist by design", () => {
    expect(meetsThreshold("voivodeship", 0)).toBe(true);
  });

  it("admits a county at exactly the threshold", () => {
    expect(meetsThreshold("county", DENSITY_THRESHOLD.county)).toBe(true);
  });

  it("rejects a county one farm short — the off-by-one that would open the floodgates", () => {
    expect(meetsThreshold("county", DENSITY_THRESHOLD.county - 1)).toBe(false);
  });

  it("rejects an empty county", () => {
    expect(meetsThreshold("county", 0)).toBe(false);
  });

  it("holds the product/city bar lower than the county bar", () => {
    // Intent pages are narrower by nature, so a lower bar is deliberate. If these ever equalise, one of
    // the two decisions in ADR 0006 has drifted.
    expect(DENSITY_THRESHOLD.productCity).toBeLessThan(DENSITY_THRESHOLD.county);
  });

  it("keeps every gated level above zero except voivodeship", () => {
    // A threshold of 0 on any deeper level means "generate everything", which is the failure ADR 0006
    // exists to prevent. This test is the tripwire for someone relaxing a number to get more pages.
    for (const [level, threshold] of Object.entries(DENSITY_THRESHOLD)) {
      if (level === "voivodeship") continue;
      expect(threshold, `${level} must not be ungated`).toBeGreaterThan(0);
    }
  });
});
