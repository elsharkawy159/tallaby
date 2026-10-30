"use server";

import { revalidatePath } from "next/cache";
import { parseSubscriberFilter, type StoreSubscriber } from "@workspace/lib/store-forms/subscribers";
import {
  deleteStoreSubscribers,
  listAllStoreSubscribers,
  setStoreSubscribersStatus,
} from "@workspace/lib/store-forms/subscribers/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/**
 * Marketing › Subscribers actions (ROADMAP.md F-16d). Every action takes an
 * explicit storeId, re-checked against the session's seller (requireStore);
 * the queries are scoped by that seller and store again. Submission ids from
 * the client only pick rows inside that store's sign-up forms. Never cached.
 */

export type SubscribersActionResult =
  | { success: true; count: number }
  | { success: false; error: "notFound" | "readOnly" | "generic" };

const failure = (error: unknown): SubscribersActionResult => {
  if (isAccessError(error)) {
    return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
  }
  console.error("[subscribers] action failed");
  return { success: false, error: "generic" };
};

const PATH = "/marketing/subscribers";

export async function setSubscribersStatus(input: {
  storeId: string;
  ids: string[];
  status: "subscribed" | "unsubscribed";
}): Promise<SubscribersActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const status = input?.status === "subscribed" ? "subscribed" : "unsubscribed";
    const result = await setStoreSubscribersStatus(seller.sellerId, store.id, Array.isArray(input?.ids) ? input.ids : [], status);
    if (!result.success) return { success: false, error: "notFound" };
    revalidatePath(PATH);
    return { success: true, count: result.count };
  } catch (error) {
    return failure(error);
  }
}

export async function deleteSubscribers(input: { storeId: string; ids: string[] }): Promise<SubscribersActionResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""), { forWrite: true });
    const result = await deleteStoreSubscribers(seller.sellerId, store.id, Array.isArray(input?.ids) ? input.ids : []);
    if (!result.success) return { success: false, error: "notFound" };
    revalidatePath(PATH);
    return { success: true, count: result.count };
  } catch (error) {
    return failure(error);
  }
}

export type ExportSubscribersResult =
  | { success: true; rows: StoreSubscriber[] }
  | { success: false; error: "notFound" | "generic" };

/** Every subscriber matching the page's filter and search, for the .xlsx export built in the browser. */
export async function exportSubscribers(input: {
  storeId: string;
  status?: string;
  query?: string;
}): Promise<ExportSubscribersResult> {
  try {
    const { seller, store } = await requireStore(String(input?.storeId ?? ""));
    const rows = await listAllStoreSubscribers(seller.sellerId, store.id, {
      status: parseSubscriberFilter(input?.status),
      query: typeof input?.query === "string" ? input.query : null,
    });
    return { success: true, rows };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[subscribers] export failed");
    return { success: false, error: "generic" };
  }
}
