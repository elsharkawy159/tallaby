"use server";

import { orderOutcome, parseCustomerKey, type CustomerNote, type CustomerOrderOutcome } from "@workspace/lib/customers";
import { getStoreCustomer, saveStoreCustomerNote } from "@workspace/lib/customers/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/**
 * Orders › Customers drawer (ROADMAP.md F-01b). Takes an explicit storeId,
 * re-checked against the session's seller (requireStore); the query is scoped
 * by that seller again. Never cached.
 */

export type CustomerOrderItem = {
  id: string;
  orderNumber: string;
  createdAt: string;
  totalAmount: string;
  paymentMethod: string;
  outcome: CustomerOrderOutcome;
};

export type CustomerOrdersResult =
  | { success: true; orders: CustomerOrderItem[] }
  | { success: false; error: "notFound" | "generic" };

export async function loadCustomerOrders(input: { storeId: string; key: string }): Promise<CustomerOrdersResult> {
  try {
    const key = String(input?.key ?? "");
    if (!parseCustomerKey(key)) return { success: false, error: "notFound" };
    const { seller, store } = await requireStore(String(input?.storeId ?? ""));
    const result = await getStoreCustomer(seller.sellerId, store.id, key);
    if (!result) return { success: false, error: "notFound" };
    return {
      success: true,
      orders: result.orders.map((o) => ({
        id: o.orderId,
        orderNumber: o.orderNumber,
        createdAt: o.createdAt,
        totalAmount: o.totalAmount,
        paymentMethod: o.paymentMethod,
        outcome: orderOutcome(o),
      })),
    };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[customers] load orders failed");
    return { success: false, error: "generic" };
  }
}

export type SaveCustomerNoteResult =
  | { success: true; value: CustomerNote }
  | { success: false; error: "notFound" | "generic" };

/**
 * Saves the note and tags of one customer (F-01c, table from 0121). Empty
 * note and no tags remove the row. The store is checked for writing against
 * the session's seller, and the query is scoped by that seller again.
 */
export async function saveCustomerNote(input: {
  storeId: string;
  key: string;
  note: string;
  tags: string[];
}): Promise<SaveCustomerNoteResult> {
  try {
    const key = String(input?.key ?? "");
    if (!parseCustomerKey(key)) return { success: false, error: "notFound" };
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const result = await saveStoreCustomerNote(seller.sellerId, {
      storeId: store.id,
      key,
      note: input?.note,
      tags: input?.tags,
      userId: seller.userId,
    });
    if (!result.saved) return { success: false, error: "notFound" };
    return { success: true, value: result.value };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[customers] save note failed");
    return { success: false, error: "generic" };
  }
}
