/**
 * Pre-order on a product (0179, ROADMAP.md F-23b). Pure, so the dashboard
 * form, the store product page and `placeOrderFromCart` share one rule.
 *
 * A pre-order product is never stock-counted: the DB trigger
 * `products_preorder_untracked` keeps `track_stock = false` while it is on, so
 * cart and checkout accept it through the unlimited-stock path (0138). The
 * date is a Cairo calendar day, stored as `YYYY-MM-DD`.
 */

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date in Cairo as YYYY-MM-DD. */
export function cairoToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** A real calendar day written as YYYY-MM-DD (2026-02-30 is not). */
export function isPreorderDay(value: unknown): value is string {
  if (typeof value !== "string" || !ISO_DAY.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

/** Latest date a seller can set: two years ahead keeps typos (2062) out. */
export function latestPreorderDay(today: string): string {
  const date = new Date(`${today}T00:00:00Z`);
  date.setUTCFullYear(date.getUTCFullYear() + 2);
  return date.toISOString().slice(0, 10);
}

/** Whether the seller may save this date: a real day from today (Cairo) to two years ahead. */
export function isAllowedPreorderDay(value: unknown, today: string = cairoToday()): value is string {
  return isPreorderDay(value) && value >= today && value <= latestPreorderDay(today);
}

export type PreorderProduct = {
  preorderEnabled?: boolean | null;
  preorderShipsAt?: string | null;
};

/**
 * The date an order line snapshots (`order_items.preorder_ships_at`): the
 * product's date while pre-order is on, else null. A date that has passed is
 * kept, so the seller still sees what the shopper was promised.
 */
export function preorderSnapshotDate(product: PreorderProduct): string | null {
  return product.preorderEnabled === true && isPreorderDay(product.preorderShipsAt) ? product.preorderShipsAt : null;
}

/**
 * What the store product page shows: null when the product is not a pre-order,
 * else the expected date, or `shipsAt: null` once that date has passed (the
 * page then says "Pre-order" without a date it can no longer keep).
 */
export function storefrontPreorder(product: PreorderProduct, today: string = cairoToday()): { shipsAt: string | null } | null {
  if (product.preorderEnabled !== true) return null;
  const date = preorderSnapshotDate(product);
  return { shipsAt: date && date >= today ? date : null };
}

/** A YYYY-MM-DD day as a Date at UTC midnight; format it with `timeZone: "UTC"` so the day never shifts. */
export function preorderDayToDate(day: string): Date {
  return new Date(`${day}T00:00:00Z`);
}
