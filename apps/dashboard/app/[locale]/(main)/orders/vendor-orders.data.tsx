import { cookies } from "next/headers";
import { PRINT_MAX_ORDERS } from "@/app/[locale]/print/orders/print-orders.lib";
import { requireOrdersView } from "@/lib/auth/require-seller.server";
import { getSellerStores } from "@/lib/stores/current-store.server";
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
import {
  ORDERS_PAGE_SIZE_COOKIE,
  isOrderId,
  parseOrdersFilters,
  type OrdersListFilters,
  type OrdersTab,
} from "./orders-view.lib";

/** Wassalha takes at most 500 orders per sheet. */
const SHIP_QUEUE_MAX = 500;

/**
 * A read started before an `await` that may throw: if the render fails first,
 * its rejection must not be reported as unhandled. Awaiting it still throws.
 */
function started<T>(promise: Promise<T>): Promise<T> {
  promise.catch(() => {});
  return promise;
}

export async function VendorOrdersData({
  searchParams,
}: {
  searchParams: Partial<Record<keyof OrdersListFilters | "order", string | string[] | undefined>>;
}) {
  // Locked orders (F-84) throw here, before any order is read: the page shows the top-up screen first.
  const [{ sellerId }, cookieStore] = await Promise.all([requireOrdersView(), cookies()]);
  const parsed = parseOrdersFilters(searchParams, cookieStore.get(ORDERS_PAGE_SIZE_COOKIE)?.value);

  // Every read below starts as soon as its own inputs exist, not one stage after another.
  const contextP = started(loadOrderRowContext(sellerId));
  const overviewP = started(loadOrdersOverview(sellerId));
  // The same per-request read loadOrderRowContext makes (cache()): the channel
  // needs only the stores, not the Bosta and Wassalha lists still loading.
  const { stores } = await getSellerStores();
  const isStore = stores.some((s) => s.id === parsed.channel);
  // An old link to a store that is gone or not theirs lists everything.
  const channel = parsed.channel === "marketplace" || isStore ? parsed.channel : "all";

  const countsP = countOrdersByTab(sellerId, { ...parsed, channel });
  // A plain /orders opens on the new orders queue when there is one; a tab in
  // the URL lets the lists start without waiting for the counts.
  const tabP: Promise<OrdersTab> = parsed.tab
    ? Promise.resolve(parsed.tab)
    : countsP.then((counts) => (counts.new > 0 ? "new" : "all"));
  const filtersP = tabP.then((tab) => ({ ...parsed, channel, tab }));

  // The requested page, read with the counts; re-read below only when it is past the end.
  const requestedIdsP = started(filtersP.then((f) => listOrderIdsPage(sellerId, f, f.page, f.size)));
  const pageP = Promise.all([filtersP, countsP]).then(async ([f, counts]) => {
    const total = counts[f.tab];
    const pages = Math.max(1, Math.ceil(total / f.size));
    // A deleted last row or an old link can point past the end.
    const page = Math.min(f.page, pages);
    const ids = page === f.page ? await requestedIdsP : await listOrderIdsPage(sellerId, f, page, f.size);
    return { total, pages, page, ids };
  });
  const printIdsP = filtersP.then((f) => listFilteredOrderIds(sellerId, f, PRINT_MAX_ORDERS));

  // One store picked with Bosta or Wassalha set up: send its waiting orders in one go (BS-12, F-12c).
  const shipQueueP = Promise.all([filtersP, contextP]).then(async ([f, context]) => {
    const bosta = isStore && context.bostaStores.has(channel);
    const wassalha = isStore && context.wassalhaStores.has(channel);
    const hasQueue = (bosta || wassalha) && (f.tab === "all" || f.tab === "new" || f.tab === "to_ship");
    const queueIds = hasQueue ? await listShipQueueIds(sellerId, f, SHIP_QUEUE_MAX) : [];
    return { orders: await loadOrderSummaries(sellerId, queueIds, context), bosta, wassalha };
  });

  // `?order=<orders.id>` opens that order, on this page or not (header search, wallet, customers).
  const orderParam = Array.isArray(searchParams.order) ? searchParams.order[0] : searchParams.order;
  const initialOrderId = isOrderId(orderParam) ? orderParam : null;
  const rowsP = Promise.all([pageP, contextP]).then(([{ ids }, context]) => {
    const offPage = initialOrderId && !ids.includes(initialOrderId) ? [initialOrderId] : [];
    return Promise.all([loadSellerOrders(sellerId, ids, context), loadSellerOrders(sellerId, offPage, context)]);
  });

  const [counts, overview, context, filters, { total, pages, page }, [rows, linked], printIds, shipQueue] =
    await Promise.all([countsP, overviewP, contextP, filtersP, pageP, rowsP, printIdsP, shipQueueP]);

  return (
    <VendorOrdersTable
      rows={rows}
      total={total}
      pages={pages}
      counts={counts}
      overview={overview}
      filters={{ ...filters, page }}
      printIds={printIds}
      shipQueue={shipQueue}
      initialOrderId={initialOrderId}
      linkedOrder={linked[0] ?? null}
      stores={context.stores.map(({ id, name }) => ({ id, name }))}
    />
  );
}
