import type { SellerOrderStage } from "./order-flow.lib";
import type { SellerOrderRow } from "./orders.types";

/** Work queues, in the order a seller works through them. */
export type OrdersTab = "all" | "new" | "to_ship" | "out_for_delivery" | "delivered" | "closed";
export type OrdersViewMode = "grid" | "table";
/** "all", "marketplace" or a store id. */
export type OrdersChannel = string;

export const ORDERS_TABS: OrdersTab[] = ["all", "new", "to_ship", "out_for_delivery", "delivered", "closed"];

export const TAB_STAGES: Record<Exclude<OrdersTab, "all">, SellerOrderStage[]> = {
  new: ["new", "awaiting_payment"],
  to_ship: ["to_ship"],
  out_for_delivery: ["out_for_delivery", "failed"],
  delivered: ["delivered"],
  closed: ["cancelled", "returned", "refund"],
};

export type OrdersSort = "newest" | "oldest" | "totalDesc" | "totalAsc";
export const ORDERS_SORTS: OrdersSort[] = ["newest", "oldest", "totalDesc", "totalAsc"];

export const ORDERS_PAGE_SIZES = [20, 50, 100, 200] as const;
export const DEFAULT_ORDERS_PAGE_SIZE = 20;
/** Cookie that remembers the seller's chosen page size. */
export const ORDERS_PAGE_SIZE_COOKIE = "tl-orders-size";
const SEARCH_MAX_LENGTH = 100;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * What the URL asks for (ROADMAP.md F-43g). Everything is validated: the URL is
 * user input. No tab means the page picks one: the new orders queue when there is one.
 */
export type OrdersListFilters = {
  tab: OrdersTab | null;
  channel: OrdersChannel;
  q: string;
  /** Only Bosta shipments that need the seller's attention. */
  attention: boolean;
  sort: OrdersSort;
  page: number;
  size: number;
};

type RawParam = string | string[] | number | boolean | null | undefined;
const single = (value: RawParam) => String((Array.isArray(value) ? value[0] : value) ?? "");

export const isOrderId = (value: unknown): value is string => typeof value === "string" && UUID.test(value);

const parsePageSize = (value: RawParam): number | null => {
  const size = Number(single(value));
  return (ORDERS_PAGE_SIZES as readonly number[]).includes(size) ? size : null;
};

export function parseOrdersFilters(
  raw: Partial<Record<keyof OrdersListFilters, RawParam>>,
  sizeFallback?: string | null,
): OrdersListFilters {
  const tab = single(raw.tab) as OrdersTab;
  const channel = single(raw.channel);
  const sort = single(raw.sort) as OrdersSort;
  const attention = single(raw.attention);
  const page = Number(single(raw.page));
  return {
    tab: ORDERS_TABS.includes(tab) ? tab : null,
    channel: channel === "marketplace" || UUID.test(channel) ? channel : "all",
    q: single(raw.q).trim().slice(0, SEARCH_MAX_LENGTH),
    attention: attention === "1" || attention === "true",
    sort: ORDERS_SORTS.includes(sort) ? sort : "newest",
    page: Number.isSafeInteger(page) && page >= 1 ? page : 1,
    size: parsePageSize(raw.size) ?? parsePageSize(sizeFallback) ?? DEFAULT_ORDERS_PAGE_SIZE,
  };
}

/** The list URL, leaving out defaults so a plain /orders stays plain. */
export function ordersListHref(filters: OrdersListFilters): string {
  const params = new URLSearchParams();
  if (filters.tab) params.set("tab", filters.tab);
  if (filters.channel !== "all") params.set("channel", filters.channel);
  if (filters.q) params.set("q", filters.q);
  if (filters.attention) params.set("attention", "1");
  if (filters.sort !== "newest") params.set("sort", filters.sort);
  if (filters.size !== DEFAULT_ORDERS_PAGE_SIZE) params.set("size", String(filters.size));
  if (filters.page > 1) params.set("page", String(filters.page));
  const query = params.toString();
  return query ? `/orders?${query}` : "/orders";
}

// The rules below decide what a row shows. The list runs them in SQL
// (orders-list.query.ts); orders-list.integration.test.ts holds the two equal.
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
