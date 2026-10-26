import type { SellerOrderStage } from "./order-flow.lib";
import type { SellerOrderRow } from "./orders.types";

/** Work queues, in the order a seller works through them. */
export type OrdersTab = "all" | "new" | "to_ship" | "out_for_delivery" | "delivered" | "closed";
export type OrdersViewMode = "grid" | "table";
/** "all", "marketplace" or a store id. */
export type OrdersChannel = string;

export const ORDERS_TABS: OrdersTab[] = ["all", "new", "to_ship", "out_for_delivery", "delivered", "closed"];

const TAB_STAGES: Record<Exclude<OrdersTab, "all">, SellerOrderStage[]> = {
  new: ["new", "awaiting_payment"],
  to_ship: ["to_ship"],
  out_for_delivery: ["out_for_delivery", "failed"],
  delivered: ["delivered"],
  closed: ["cancelled", "returned", "refund"],
};

type ViewableOrder = Pick<
  SellerOrderRow,
  "orderNumber" | "customerName" | "customerPhone" | "storeId" | "flow"
>;

export function matchesTab(order: ViewableOrder, tab: OrdersTab): boolean {
  return tab === "all" || TAB_STAGES[tab].includes(order.flow.stage);
}

export function matchesChannel(order: ViewableOrder, channel: OrdersChannel): boolean {
  if (channel === "all") return true;
  if (channel === "marketplace") return order.storeId === null;
  return order.storeId === channel;
}

/** Order number, customer name or phone (digits only, so spaces and +20 don't matter). */
export function matchesQuery(order: ViewableOrder, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (order.orderNumber.toLowerCase().includes(q.replace(/^#/, ""))) return true;
  if (order.customerName.toLowerCase().includes(q)) return true;
  const digits = q.replace(/\D/g, "");
  return digits.length >= 3 && (order.customerPhone ?? "").replace(/\D/g, "").includes(digits);
}

export function countByTab(orders: ViewableOrder[]): Record<OrdersTab, number> {
  return Object.fromEntries(
    ORDERS_TABS.map((tab) => [tab, orders.filter((o) => matchesTab(o, tab)).length]),
  ) as Record<OrdersTab, number>;
}

/** The tab the page opens on: the new orders queue when there is one. */
export function initialTab(orders: ViewableOrder[]): OrdersTab {
  return orders.some((o) => matchesTab(o, "new")) ? "new" : "all";
}
