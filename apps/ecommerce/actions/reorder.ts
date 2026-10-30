"use server";

import { addToCart } from "@/actions/cart";
import { planReorder, reorderAccess } from "@/lib/reorder/reorder.server";

export type ReorderResult =
  | { success: true; added: number; capped: number; skipped: number }
  | { success: false; error: "notAllowed" | "nothingAvailable" | "failed" };

/**
 * "Order again" (ROADMAP.md F-01e): puts the order's lines that are still
 * sold here back in this store's cart, at today's prices (`addToCart` writes
 * the current price, as for any add). The client sends the order id only;
 * the store comes from the host and ownership from the session.
 */
export async function reorderAction(orderId: string): Promise<ReorderResult> {
  try {
    const access = await reorderAccess(orderId);
    if (!access) return { success: false, error: "notAllowed" };
    const plan = await planReorder(orderId, access);
    let added = 0;
    let failed = 0;
    for (const line of plan.lines) {
      const result = await addToCart({ productId: line.productId, quantity: line.quantity, ...(line.variantId && { variantId: line.variantId }) });
      if (result.success) added += 1;
      else failed += 1;
    }
    if (!added) return { success: false, error: "nothingAvailable" };
    return { success: true, added, capped: plan.capped, skipped: plan.skipped.length + failed };
  } catch (error) {
    console.error("[reorder] failed:", (error as Error)?.message);
    return { success: false, error: "failed" };
  }
}
