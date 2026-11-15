/**
 * Orders › Cross-sell report (ROADMAP.md F-32f): pure rules shared by the query,
 * the page and their tests. Counts come from what each order saved in
 * `order_items.metadata.crossSell` (the snapshot in `@workspace/lib/orders`), so
 * an edited or deleted offer keeps its history. Money is in integer piastres.
 */

export const CROSS_SELL_REPORT_DAYS = [7, 30, 90] as const;
export type CrossSellReportDays = (typeof CROSS_SELL_REPORT_DAYS)[number];
const DEFAULT_DAYS: CrossSellReportDays = 30;

export const CROSS_SELL_REPORT_PAGE_SIZES = [20, 50] as const;
const DEFAULT_SIZE = CROSS_SELL_REPORT_PAGE_SIZES[0];

/**
 * Not counted: the order fell through, so no discount was really given
 * (`payment_processing` is a card order not paid yet).
 */
export const CROSS_SELL_REPORT_EXCLUDED_STATUSES = ["payment_processing", "cancelled", "refunded", "returned"] as const;

export type CrossSellReportFilters = { days: CrossSellReportDays; page: number; size: number };

export function parseCrossSellReportFilters(params: { days?: unknown; page?: unknown; size?: unknown }): CrossSellReportFilters {
  const days = typeof params.days === "string" ? Number(params.days) : Number.NaN;
  const size = typeof params.size === "string" ? Number(params.size) : Number.NaN;
  const page = typeof params.page === "string" && /^\d{1,6}$/.test(params.page) ? Number(params.page) : 1;
  return {
    days: (CROSS_SELL_REPORT_DAYS as readonly number[]).includes(days) ? (days as CrossSellReportDays) : DEFAULT_DAYS,
    page: Math.max(page, 1),
    size: (CROSS_SELL_REPORT_PAGE_SIZES as readonly number[]).includes(size) ? size : DEFAULT_SIZE,
  };
}

/** The discount one saved snapshot gave, as the query sums it. */
export function snapshotDiscountPiastres(snapshot: { unitDiscountPiastres: number; discountedUnits: number }): number {
  return snapshot.unitDiscountPiastres * snapshot.discountedUnits;
}

/** A database count or sum (text or number) as a whole number; anything else is 0. */
export function reportInteger(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : 0;
}

/** Piastres as a 2 dp decimal string, without going through a float. */
export function piastresToDecimal(piastres: number): string {
  const whole = Math.floor(piastres / 100);
  const rest = String(piastres % 100).padStart(2, "0");
  return `${whole}.${rest}`;
}

export type CrossSellReportRow = {
  offerId: string;
  /** The product offered, as named on its latest order. */
  offerName: string;
  /** The product it was offered with, as named on that order. */
  mainName: string | null;
  /** Orders that took it. */
  orders: number;
  /** Units sold at the offer's price. */
  units: number;
  /** Discount given, 2 dp decimal string. */
  discount: string;
};

export type CrossSellReportTotals = { orders: number; units: number; discount: string };

export function reportRowFrom(raw: Record<string, unknown>): CrossSellReportRow {
  return {
    offerId: String(raw.offer_id ?? ""),
    offerName: String(raw.offer_name ?? ""),
    mainName: raw.main_name == null ? null : String(raw.main_name),
    orders: reportInteger(raw.orders),
    units: reportInteger(raw.units),
    discount: piastresToDecimal(reportInteger(raw.discount_piastres)),
  };
}

export function reportTotalsFrom(raw: Record<string, unknown> | undefined): CrossSellReportTotals {
  return {
    orders: reportInteger(raw?.orders),
    units: reportInteger(raw?.units),
    discount: piastresToDecimal(reportInteger(raw?.discount_piastres)),
  };
}
