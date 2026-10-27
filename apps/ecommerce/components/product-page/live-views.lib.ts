/**
 * The product page's live views line (0111, the seller's `show_live_views`
 * switch): an illustrative number, not a measurement. It starts from a value
 * fixed per product, so a reload doesn't jump wildly, and drifts a little
 * every second inside a band around it.
 */

export const LIVE_VIEWS_TICK_MS = 1000;
const MIN_BASE = 6;
const BASE_SPREAD = 30;
const BAND = 8;
const FLOOR = 2;

/** A stable starting count for a product: 6–35. */
export function liveViewsBase(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  return MIN_BASE + (hash % BASE_SPREAD);
}

/** The next count: a step of -2…+2 (`random` in [0, 1)), kept within `base ± BAND` and never below 2. */
export function nextLiveViews(current: number, base: number, random: number): number {
  const step = Math.floor(random * 5) - 2;
  const low = Math.max(FLOOR, base - BAND);
  return Math.min(base + BAND, Math.max(low, current + step));
}
