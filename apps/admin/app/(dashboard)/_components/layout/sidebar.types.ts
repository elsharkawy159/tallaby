/** Actionable counts only — each one is something an admin should look at. */
export interface SidebarCounts {
  /** Customers who signed up today (Cairo time). */
  newCustomers: number;
  /** Active carts with items that haven't been sent a reminder yet. */
  unremindedCarts: number;
  pendingOrders: number;
  /** Products awaiting approval. */
  pendingProducts: number;
  /** Sellers awaiting approval. */
  pendingSellers: number;
}

export interface SidebarProps {
  counts: SidebarCounts;
}

export const SIDEBAR_COUNT_BADGE_CLASS =
  "ml-2 shrink-0 tabular-nums text-xs px-1.5 py-0 h-4 min-w-4 font-normal leading-none";

export const EMPTY_SIDEBAR_COUNTS: SidebarCounts = {
  newCustomers: 0,
  unremindedCarts: 0,
  pendingOrders: 0,
  pendingProducts: 0,
  pendingSellers: 0,
};
