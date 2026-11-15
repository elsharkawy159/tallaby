import type { SellerOrderAction } from "./order-flow.lib";
import type { SellerOrderRow } from "./orders.types";

/**
 * Stage moves a seller can run on many orders at once (ROADMAP.md F-04c).
 * "fail" needs a reason per order and "return" is rare, so both stay on the
 * order itself. Each order is still checked against its own flow, here and
 * on the server.
 */
export const BULK_ORDER_ACTIONS = ["confirm", "ship", "deliver", "cancel"] as const satisfies readonly SellerOrderAction[];
export type BulkOrderAction = (typeof BULK_ORDER_ACTIONS)[number];

/** Orders one server call moves; the client sends bigger selections in chunks. */
export const BULK_MAX_ORDERS = 50;

type BulkOrder = Pick<SellerOrderRow, "id" | "flow">;

/** The selected orders this action applies to right now. */
export function bulkTargets<T extends BulkOrder>(orders: readonly T[], action: BulkOrderAction): T[] {
  return orders.filter((o) => o.flow.actions.includes(action));
}

/** Each bulk action with how many selected orders it applies to; actions that fit none are left out. */
export function bulkActionCounts(orders: readonly BulkOrder[]): { action: BulkOrderAction; count: number }[] {
  return BULK_ORDER_ACTIONS.map((action) => ({ action, count: bulkTargets(orders, action).length })).filter(
    (a) => a.count > 0,
  );
}

export function chunk<T>(items: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
