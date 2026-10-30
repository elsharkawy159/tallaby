"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation } from "@workspace/cache";
import { deleteTrashedProductsForever, restoreProducts, trashProducts } from "@workspace/lib/products/trash/server";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";

/**
 * Product Trash actions (0123, ROADMAP.md F-35). The seller comes from the
 * session; product ids from the client are only matched together with it
 * (in @workspace/lib/products/trash/server).
 */

export type TrashActionResult =
  | { success: true; count: number; ids: string[] }
  | { success: false; error: "unauthorized" | "readOnly" | "generic" };

function failure(error: unknown, label: string): TrashActionResult {
  if (isAccessError(error)) return { success: false, error: error.code === "seller_blocked" ? "readOnly" : "unauthorized" };
  console.error(`[product-trash] ${label} failed`, error);
  return { success: false, error: "generic" };
}

/** Delete → Trash (row action and bulk delete on Products). */
export async function trashProductsAction(ids: unknown): Promise<TrashActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const { trashed, invalidation } = await trashProducts(seller.sellerId, seller.userId, ids);
    await applyInvalidation(invalidation, { from: "dashboard", mode: "action" });
    revalidatePath("/products", "layout");
    return { success: true, count: trashed.length, ids: trashed };
  } catch (error) {
    return failure(error, "trash");
  }
}

export async function restoreProductsAction(ids: unknown): Promise<TrashActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    // Same rule as the Publish switch: only approved sellers make products live.
    const { restored, invalidation } = await restoreProducts(seller.sellerId, ids, { canPublish: seller.status === "approved" });
    await applyInvalidation(invalidation, { from: "dashboard", mode: "action" });
    revalidatePath("/products", "layout");
    return { success: true, count: restored.length, ids: restored };
  } catch (error) {
    return failure(error, "restore");
  }
}

export async function deleteProductsForeverAction(ids: unknown): Promise<TrashActionResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const { deleted } = await deleteTrashedProductsForever(seller.sellerId, ids);
    revalidatePath("/products", "layout");
    return { success: true, count: deleted.length, ids: deleted };
  } catch (error) {
    return failure(error, "delete forever");
  }
}
