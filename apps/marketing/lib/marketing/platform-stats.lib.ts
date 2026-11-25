/**
 * The home page's stats strip (2026-11-25): real platform counts, rounded down
 * to a clean figure so the page never claims more than the database holds.
 * A count under its floor is too small to show and gives `null`, so the strip
 * shows a true non-number fact in its place (owner rule: no invented numbers).
 */

export type PlatformCounts = { stores: number; products: number; orders: number };
export type PlatformStats = { stores: number | null; products: number | null; orders: number | null };

/** Below these, the figure isn't shown. */
export const STAT_FLOORS: PlatformCounts = { stores: 100, products: 500, orders: 1000 };

/**
 * Rounds down to one significant digit under 10,000 (230 → 200, 1,155 → 1,000,
 * 4,870 → 4,000) and to whole thousands from there (12,345 → 12,000).
 * Never rounds up. Not a finite positive number → 0.
 */
export function roundDownClean(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  const n = Math.floor(value);
  if (n >= 10_000) return Math.floor(n / 1000) * 1000;
  const step = 10 ** (String(n).length - 1);
  return Math.floor(n / step) * step;
}

/** The figure to show for one count, or null when it is under its floor. */
export function statFigure(count: number, floor: number): number | null {
  if (!Number.isFinite(count) || count < floor) return null;
  return roundDownClean(count);
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
