/**
 * "Where your sales came from" on /financial: groups the seller's earnings by
 * sales channel (Tallaby marketplace or one of the seller's stores) and by
 * payment method. Pure, so it is unit-tested; the query lives in financial.data.tsx.
 */

/** One row per (store, payment method) from the grouped order-items query. */
export type SalesSourceRow = {
  storeId: string | null;
  paymentMethod: string | null;
  earning: string | number | null;
  orders: string | number | null;
};

export type SalesSourceLine = {
  /** "marketplace", a store id, or a normalized payment method key. */
  key: string;
  /** Store name for store channels; null for marketplace and payment methods. */
  name: string | null;
  amount: number;
  orders: number;
  /** Share of the period's total, 0–100. */
  share: number;
};

export type SalesSources = {
  total: number;
  orders: number;
  channels: SalesSourceLine[];
  paymentMethods: SalesSourceLine[];
};

export const MARKETPLACE_CHANNEL = "marketplace";

/** Month start in server time, the same boundary as the "This month sales" card. */
export function startOfMonth(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

/** Folds the checkout's payment-method spellings into one key per method. */
export function normalizePaymentMethod(method: string | null | undefined): string {
  const value = (method ?? "").trim().toLowerCase();
  if (!value || value === "cash" || value === "cod" || value === "cash_on_delivery") return "cod";
  // Split checkouts are stored as `wallet_<method>`; the wallet paid first.
  if (value.startsWith("wallet")) return "wallet";
  return value;
}

const toPiastres = (value: string | number | null) => {
  const num = typeof value === "string" ? parseFloat(value) : (value ?? 0);
  return Number.isFinite(num) ? Math.round(num * 100) : 0;
};

const toCount = (value: string | number | null) => {
  const num = typeof value === "string" ? parseInt(value, 10) : (value ?? 0);
  return Number.isFinite(num) ? num : 0;
};

export function buildSalesSources(
  rows: SalesSourceRow[],
  stores: { id: string; name: string }[]
): SalesSources {
  const storeNames = new Map(stores.map((s) => [s.id, s.name]));
  const channels = new Map<string, { piastres: number; orders: number }>();
  const methods = new Map<string, { piastres: number; orders: number }>();
  let total = 0;
  let orders = 0;

  const add = (map: typeof channels, key: string, piastres: number, count: number) => {
    const line = map.get(key) ?? { piastres: 0, orders: 0 };
    line.piastres += piastres;
    line.orders += count;
    map.set(key, line);
  };

  for (const row of rows) {
    const piastres = toPiastres(row.earning);
    const count = toCount(row.orders);
    if (piastres === 0 && count === 0) continue;
    // Matches the orders page filter: no store means a marketplace order.
    add(channels, row.storeId ?? MARKETPLACE_CHANNEL, piastres, count);
    add(methods, normalizePaymentMethod(row.paymentMethod), piastres, count);
    total += piastres;
    orders += count;
  }

  const toLines = (map: typeof channels, withNames: boolean): SalesSourceLine[] =>
    [...map.entries()]
      .map(([key, line]) => ({
        key,
        name: withNames && key !== MARKETPLACE_CHANNEL ? (storeNames.get(key) ?? null) : null,
        amount: line.piastres / 100,
        orders: line.orders,
        share: total > 0 ? (line.piastres / total) * 100 : 0,
      }))
      .sort((a, b) => b.amount - a.amount || b.orders - a.orders);

  return {
    total: total / 100,
    orders,
    channels: toLines(channels, true),
    paymentMethods: toLines(methods, false),
  };
}
