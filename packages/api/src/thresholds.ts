/**
 * The density gate from ADR 0006 — the single place that decides whether a location page exists.
 *
 * Why this is a module and not an inline number: generating every product-by-place combination yields
 * ~75,000 pages from 30 products and 2477 municipalities, of which ~74,000 would be empty. Google reads
 * that as thin or doorway content and can penalise the whole domain. Having few pages is not penalised;
 * having empty ones is.
 *
 * Breaking this is invisible — nothing throws, pages just quietly become worthless and rankings drop
 * months later. It is therefore covered by a mandatory end-to-end test.
 */
export const DENSITY_THRESHOLD = {
  /** Voivodeship pages always exist: 16 of them, and ~12 farms each at 200 farms nationally. */
  voivodeship: 0,
  /** A county page needs real content behind it. */
  county: 5,
  /** Municipality pages are the long tail; they need the same bar as a county. */
  municipality: 5,
  /** `/[product]/[city]` intent pages, counted within range of the city. */
  productCity: 3,
} as const;

export type GatedLevel = keyof typeof DENSITY_THRESHOLD;

/** True when a level/count pair earns a page. Prefer this over comparing to the constants by hand. */
export function meetsThreshold(level: GatedLevel, publishedFarmCount: number): boolean {
  return publishedFarmCount >= DENSITY_THRESHOLD[level];
}
