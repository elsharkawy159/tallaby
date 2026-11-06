"use server";

import { isAccessError, requireOrdersView } from "@/lib/auth/require-seller.server";
import { listFilteredOrderIds } from "./orders-list.query";
import { loadOrderRowContext } from "./orders-row-context.data";
import { loadOrderSummaries, loadSellerOrders } from "./orders.query";
import type { OrderSummary, SellerOrderRow } from "./orders.types";
import { isOrderId, parseOrdersFilters } from "./orders-view.lib";

/**
 * Actions on the whole filtered list, not just the page on screen (ROADMAP.md
 * F-43g). The seller comes from the session. Filters from the client are parsed
 * again here, and client ids only match the seller's own orders.
 */

/** Most orders "select all" picks; bulk moves run 50 at a time from the browser. */
const SELECT_ALL_MAX = 5000;
/** Most orders one export call returns; the browser asks in chunks. */
const EXPORT_CHUNK_MAX = 200;

/** `testOnly` comes from the server (F-76: a seller who isn't activated sees only test orders), never the client. */
const parseFilters = (filters: unknown, testOnly: boolean) => ({
  ...parseOrdersFilters((filters ?? {}) as Parameters<typeof parseOrdersFilters>[0]),
  testOnly,
});

const failure = (error: unknown, label: string) => {
  if (!isAccessError(error)) console.error(`[orders-list] ${label} failed`, error);
  return { success: false as const };
};

/** Every filtered order id: the export asks for its rows in chunks. */
export async function listFilteredOrderIdsAction(
  filters: unknown,
): Promise<{ success: true; ids: string[] } | { success: false }> {
  try {
    const { sellerId, testOnly } = await requireOrdersView();
    return { success: true, ids: await listFilteredOrderIds(sellerId, parseFilters(filters, testOnly)) };
  } catch (error) {
    return failure(error, "list ids");
  }
}

/** "Select all": the filtered orders with what bulk moves read. */
export async function selectFilteredOrdersAction(
  filters: unknown,
): Promise<{ success: true; orders: OrderSummary[]; capped: boolean } | { success: false }> {
  try {
    const { sellerId, testOnly } = await requireOrdersView();
    const ids = await listFilteredOrderIds(sellerId, parseFilters(filters, testOnly), SELECT_ALL_MAX + 1);
    const context = await loadOrderRowContext(sellerId);
    return {
      success: true,
      orders: await loadOrderSummaries(sellerId, ids.slice(0, SELECT_ALL_MAX), context, testOnly),
      capped: ids.length > SELECT_ALL_MAX,
    };
  } catch (error) {
    return failure(error, "select all");
  }
}

/** Rows for the .xlsx export, in the order asked. */
export async function loadOrdersForExportAction(
  ids: unknown,
): Promise<{ success: true; orders: SellerOrderRow[] } | { success: false }> {
  try {
    const { sellerId, testOnly } = await requireOrdersView();
    const wanted = Array.isArray(ids) ? ids.filter(isOrderId).slice(0, EXPORT_CHUNK_MAX) : [];
    const context = await loadOrderRowContext(sellerId);
    return { success: true, orders: await loadSellerOrders(sellerId, wanted, context, { withRisks: false, testOnly }) };
  } catch (error) {
    return failure(error, "export");
  }
}

/**
 * One order for the open panel, when a refresh took it off the page (it moved
 * to another tab). Null when it isn't this seller's.
 */
export async function loadOrderRowAction(id: unknown): Promise<SellerOrderRow | null> {
  try {
    if (!isOrderId(id)) return null;
    const { sellerId, testOnly } = await requireOrdersView();
    const [row] = await loadSellerOrders(sellerId, [id], await loadOrderRowContext(sellerId), { testOnly });
    return row ?? null;
  } catch (error) {
    failure(error, "load order");
    return null;
  }
}
