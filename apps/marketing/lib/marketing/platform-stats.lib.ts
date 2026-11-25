/**
 * The home page's stats strip (2026-11-25): real platform counts, rounded up
 * to a round step (owner's choice, 2026-11-25).
 * A count under its floor is too small to show and gives `null`, so the strip
 * shows a true non-number fact in its place (owner rule: no invented numbers).
 */

export type PlatformCounts = { stores: number; products: number; orders: number };
export type PlatformStats = { stores: number | null; products: number | null; orders: number | null };

/** Below these, the figure isn't shown. */
export const STAT_FLOORS: PlatformCounts = { stores: 100, products: 500, orders: 1000 };

/**
 * Rounds up to a round step (owner, 2026-11-25: "250, 300, 350, 400 … round
 * up"): steps of 10 under 100, 50 under 1,000 (230 → 250, 251 → 300), 100
 * under 10,000 (1,155 → 1,200) and 1,000 from there (12,345 → 13,000). An
 * exact step stays as it is. Not a finite positive number → 0.
 */
export function roundUpStat(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const n = Math.ceil(value);
  const step = n < 100 ? 10 : n < 1000 ? 50 : n < 10_000 ? 100 : 1000;
  return Math.ceil(n / step) * step;
}

/** The figure to show for one count, or null when it is under its floor. */
export function statFigure(count: number, floor: number): number | null {
  if (!Number.isFinite(count) || count < floor) return null;
  return roundUpStat(count);
}

export function toPlatformStats(counts: PlatformCounts | null): PlatformStats {
  if (!counts) return { stores: null, products: null, orders: null };
  return {
    stores: statFigure(counts.stores, STAT_FLOORS.stores),
    products: statFigure(counts.products, STAT_FLOORS.products),
    orders: statFigure(counts.orders, STAT_FLOORS.orders),
  };
}

/** "1,000+" in English, "+1,000" in Arabic (read as "more than"). Latin digits in both. */
export function formatStat(value: number, locale: string): string {
  const digits = new Intl.NumberFormat("en-US").format(value);
  return locale === "ar" ? `+${digits}` : `${digits}+`;
}
