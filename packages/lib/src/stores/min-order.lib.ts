/**
 * Store-wide minimum order value (ROADMAP.md F-13b). Pure, safe on the client.
 *
 * Stored in `stores.settings.minOrder` (other keys kept); no migration. Off
 * by default. Only store websites read it; the marketplace checkout never
 * does. Validation only: it never changes a price, a fee or the shipping.
 *
 * Which subtotal counts: the items subtotal, i.e. every cart line's unit
 * price (after the product's own discount, as the cart stores it) times its
 * quantity, before shipping and BEFORE any coupon. A coupon therefore never
 * blocks an order the cart already qualified for, and the cart page (which
 * has no coupon) shows the same number as the checkout. Money is compared in
 * integer piastres.
 */

/** Highest minimum a store can set: EGP 1,000,000. */
export const MIN_ORDER_MAX_PIASTRES = 100_000_000;

export type StoreMinOrder = {
  /** Off until the seller turns it on. */
  enabled: boolean;
  /** The minimum items subtotal in piastres (EGP × 100); 0 when never set. */
  amountPiastres: number;
};

export const MIN_ORDER_DEFAULTS: StoreMinOrder = { enabled: false, amountPiastres: 0 };

/** EGP (number or numeric string, as `numeric(10,2)` columns come back) → integer piastres. */
export function egpToPiastres(value: number | string | null | undefined): number {
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value) : NaN;
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** Piastres → plain EGP text for messages: "300", "299.50" (no grouping, no currency). */
export function piastresToEgpText(piastres: number): string {
  const value = Math.max(0, Math.round(piastres));
  return value % 100 === 0 ? String(value / 100) : (value / 100).toFixed(2);
}

function cleanAmount(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value)) return 0;
  return value > 0 && value <= MIN_ORDER_MAX_PIASTRES ? value : 0;
}

/** The store's minimum order from `stores.settings`, re-validated. On only with a valid amount. */
export function parseStoreMinOrder(settings: unknown): StoreMinOrder {
  const raw = (settings as { minOrder?: unknown } | null | undefined)?.minOrder;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return { ...MIN_ORDER_DEFAULTS };
  const value = raw as { enabled?: unknown; amountPiastres?: unknown };
  const amountPiastres = cleanAmount(value.amountPiastres);
  return { enabled: value.enabled === true && amountPiastres > 0, amountPiastres };
}

/** The minimum in piastres while it is on, else null. */
export function activeMinOrderPiastres(minOrder: StoreMinOrder | null | undefined): number | null {
  if (!minOrder?.enabled) return null;
  const amount = cleanAmount(minOrder.amountPiastres);
  return amount > 0 ? amount : null;
}

/** Sum of unit price × quantity in piastres (each unit price rounded to piastres first). */
export function itemsSubtotalPiastres(items: readonly { price: number | string; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + egpToPiastres(item.price) * Math.max(0, Math.trunc(item.quantity)), 0);
}

export type MinOrderCheck =
  | { ok: true }
  | {
      ok: false;
      /** The store's minimum, in piastres. */
      minimumPiastres: number;
      /** How much more the customer must add, in piastres (> 0). */
      shortPiastres: number;
    };

/**
 * Whether an items subtotal (piastres, before shipping and coupons) reaches
 * the store's minimum. Exactly the minimum passes. Used by the server at
 * order creation and by the cart and checkout for the "add X more" message.
 */
export function checkMinOrder(minOrder: StoreMinOrder | null | undefined, subtotalPiastres: number): MinOrderCheck {
  const minimumPiastres = activeMinOrderPiastres(minOrder);
  if (minimumPiastres == null) return { ok: true };
  const subtotal = Number.isFinite(subtotalPiastres) ? Math.max(0, Math.round(subtotalPiastres)) : 0;
  if (subtotal >= minimumPiastres) return { ok: true };
  return { ok: false, minimumPiastres, shortPiastres: minimumPiastres - subtotal };
}
