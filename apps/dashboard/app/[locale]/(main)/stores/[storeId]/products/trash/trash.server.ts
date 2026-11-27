"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation } from "@workspace/cache";
import { deleteTrashedProductsForever, restoreProducts, trashProducts } from "@workspace/lib/products/trash/server";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { requireProductStore } from "@/lib/products/product-store.server";
import { autoPublishStoreIfReady } from "@/lib/stores/auto-publish-store.server";
import { STORE_PRODUCTS_PATTERN } from "@/lib/products/product-routes.lib";
import type { LiveSite } from "@/app/[locale]/(main)/_components/publish-celebration.client";

/** Store settings › Trash, where trashed products are listed (owner, 2026-11-27). */
const STORE_TRASH_PATTERN = "/stores/[storeId]/settings/trash";

/**
 * Product Trash actions (0123, ROADMAP.md F-35). The seller comes from the
 * session; the store is the explicit `storeId` the page sends, checked
 * against that seller (F-87c), and product ids from the client are only
 * matched together with both (in @workspace/lib/products/trash/server).
 * A foreign or forged store is "unauthorized" (not_found), and products
 * outside the store are skipped, as products of another seller always were.
 * No `forWrite` on the store: an archived or suspended store doesn't block
 * product writes yet (slice 2 decides that with the route move).
 */

export type TrashActionResult =
  /** `live` (restore only): the store went live just now, for the go-live dialog. */
  | { success: true; count: number; ids: string[]; live?: LiveSite }
  | { success: false; error: "unauthorized" | "readOnly" | "generic" };

function failure(error: unknown, label: string): TrashActionResult {
  if (isAccessError(error)) return { success: false, error: error.code === "seller_blocked" ? "readOnly" : "unauthorized" };
  console.error(`[product-trash] ${label} failed`, error);
  return { success: false, error: "generic" };
}

/** Delete → Trash (row action and bulk delete on Products). */
export async function trashProductsAction(storeId: unknown, ids: unknown): Promise<TrashActionResult> {
  try {
    const { seller, inStore } = await requireProductStore(storeId);
    const { trashed, invalidation } = await trashProducts(seller.sellerId, seller.userId, ids, { inStore });
    await applyInvalidation(invalidation, { from: "dashboard", mode: "action" });
    revalidateDashboardPath(STORE_PRODUCTS_PATTERN, "layout");
    revalidateDashboardPath(STORE_TRASH_PATTERN, "page");
    return { success: true, count: trashed.length, ids: trashed };
  } catch (error) {
    return failure(error, "trash");
  }
}

export async function restoreProductsAction(storeId: unknown, ids: unknown): Promise<TrashActionResult> {
  try {
    const { seller, store, inStore } = await requireProductStore(storeId);
    // Same rule as the Publish switch: only approved sellers make products live.
    const { restored, wentLive, invalidation } = await restoreProducts(seller.sellerId, ids, { canPublish: seller.status === "approved", inStore });
    await applyInvalidation(invalidation, { from: "dashboard", mode: "action" });
    // A product back live: a new store with a chosen template can go live now (owner, 2026-11-17). Once for the store.
    const live = wentLive ? await autoPublishStoreIfReady(seller.sellerId, store.id, seller.userId) : null;
    revalidateDashboardPath(STORE_PRODUCTS_PATTERN, "layout");
    revalidateDashboardPath(STORE_TRASH_PATTERN, "page");
    return { success: true, count: restored.length, ids: restored, ...(live && { live }) };
  } catch (error) {
    return failure(error, "restore");
  }
}

export async function deleteProductsForeverAction(storeId: unknown, ids: unknown): Promise<TrashActionResult> {
  try {
    const { seller, inStore } = await requireProductStore(storeId);
    const { deleted } = await deleteTrashedProductsForever(seller.sellerId, ids, { inStore });
    revalidateDashboardPath(STORE_PRODUCTS_PATTERN, "layout");
    revalidateDashboardPath(STORE_TRASH_PATTERN, "page");
    return { success: true, count: deleted.length, ids: deleted };
  } catch (error) {
    return failure(error, "delete forever");
  }
}
