"use server";

import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
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

const parseFilters = (filters: unknown) =>
  parseOrdersFilters((filters ?? {}) as Parameters<typeof parseOrdersFilters>[0]);

const failure = (error: unknown, label: string) => {
  if (!isAccessError(error)) console.error(`[orders-list] ${label} failed`, error);
  return { success: false as const };
};

/** Every filtered order id: the export asks for its rows in chunks. */
export async function listFilteredOrderIdsAction(
  filters: unknown,
): Promise<{ success: true; ids: string[] } | { success: false }> {
  try {
    const { sellerId } = await requireSeller();
    return { success: true, ids: await listFilteredOrderIds(sellerId, parseFilters(filters)) };
  } catch (error) {
    return failure(error, "list ids");
  }
}

/** "Select all": the filtered orders with what bulk moves read. */
export async function selectFilteredOrdersAction(
  filters: unknown,
): Promise<{ success: true; orders: OrderSummary[]; capped: boolean } | { success: false }> {
  try {
    const { sellerId } = await requireSeller();
    const ids = await listFilteredOrderIds(sellerId, parseFilters(filters), SELECT_ALL_MAX + 1);
    const context = await loadOrderRowContext(sellerId);
    return {
      success: true,
      orders: await loadOrderSummaries(sellerId, ids.slice(0, SELECT_ALL_MAX), context),
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
    const { sellerId } = await requireSeller();
    const wanted = Array.isArray(ids) ? ids.filter(isOrderId).slice(0, EXPORT_CHUNK_MAX) : [];
    const context = await loadOrderRowContext(sellerId);
    return { success: true, orders: await loadSellerOrders(sellerId, wanted, context, { withRisks: false }) };
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
    const { sellerId } = await requireSeller();
    const [row] = await loadSellerOrders(sellerId, [id], await loadOrderRowContext(sellerId));
    return row ?? null;
  } catch (error) {
    failure(error, "load order");
    return null;
  }
}
