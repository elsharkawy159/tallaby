import { cookies } from "next/headers";
import { PRINT_MAX_ORDERS } from "@/app/print/orders/print-orders.lib";
import { requireSeller } from "@/lib/auth/require-seller.server";
import {
  countOrdersByTab,
  listFilteredOrderIds,
  listOrderIdsPage,
  listShipQueueIds,
  loadOrdersOverview,
} from "./orders-list.query";
import { VendorOrdersTable } from "./orders-chunks";
import { loadOrderRowContext } from "./orders-row-context.data";
import { loadOrderSummaries, loadSellerOrders } from "./orders.query";
import { ORDERS_PAGE_SIZE_COOKIE, isOrderId, parseOrdersFilters, type OrdersListFilters } from "./orders-view.lib";

/** Wassalha takes at most 500 orders per sheet. */
const SHIP_QUEUE_MAX = 500;

export async function VendorOrdersData({
  searchParams,
}: {
  searchParams: Partial<Record<keyof OrdersListFilters | "order", string | string[] | undefined>>;
}) {
  const [{ sellerId }, cookieStore] = await Promise.all([requireSeller(), cookies()]);
  const context = await loadOrderRowContext(sellerId);
  const parsed = parseOrdersFilters(searchParams, cookieStore.get(ORDERS_PAGE_SIZE_COOKIE)?.value);
  const isStore = context.stores.some((s) => s.id === parsed.channel);
  // An old link to a store that is gone or not theirs lists everything.
  const channel = parsed.channel === "marketplace" || isStore ? parsed.channel : "all";

  const [counts, overview] = await Promise.all([
    countOrdersByTab(sellerId, { ...parsed, channel }),
    loadOrdersOverview(sellerId),
  ]);
  // A plain /orders opens on the new orders queue when there is one.
  const tab = parsed.tab ?? (counts.new > 0 ? "new" : "all");
  const filters = { ...parsed, channel, tab };
  const total = counts[tab];
  const pages = Math.max(1, Math.ceil(total / filters.size));
  // A deleted last row or an old link can point past the end.
  const page = Math.min(filters.page, pages);

  // One store picked with Bosta or Wassalha set up: send its waiting orders in one go (BS-12, F-12c).
  const bosta = isStore && context.bostaStores.has(channel);
  const wassalha = isStore && context.wassalhaStores.has(channel);
  const hasQueue = (bosta || wassalha) && (tab === "all" || tab === "new" || tab === "to_ship");

  const [ids, printIds, queueIds] = await Promise.all([
    listOrderIdsPage(sellerId, filters, page, filters.size),
    listFilteredOrderIds(sellerId, filters, PRINT_MAX_ORDERS),
    hasQueue ? listShipQueueIds(sellerId, filters, SHIP_QUEUE_MAX) : Promise.resolve([]),
  ]);

  // `?order=<orders.id>` opens that order, on this page or not (header search, wallet, customers).
  const orderParam = Array.isArray(searchParams.order) ? searchParams.order[0] : searchParams.order;
  const initialOrderId = isOrderId(orderParam) ? orderParam : null;
  const offPage = initialOrderId && !ids.includes(initialOrderId) ? [initialOrderId] : [];

  const [rows, linked, queue] = await Promise.all([
    loadSellerOrders(sellerId, ids, context),
    loadSellerOrders(sellerId, offPage, context),
    loadOrderSummaries(sellerId, queueIds, context),
  ]);

  return (
    <VendorOrdersTable
      rows={rows}
      total={total}
      pages={pages}
      counts={counts}
      overview={overview}
      filters={{ ...filters, page }}
      printIds={printIds}
      shipQueue={{ orders: queue, bosta, wassalha }}
      initialOrderId={initialOrderId}
      linkedOrder={linked[0] ?? null}
      stores={context.stores.map(({ id, name }) => ({ id, name }))}
    />
  );
}
