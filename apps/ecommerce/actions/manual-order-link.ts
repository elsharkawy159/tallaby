"use server";

import { revalidatePath } from "next/cache";
import { confirmManualOrderLink } from "@workspace/lib/orders/manual/server";
import { verifyOrderAccess } from "@/lib/order-access-token";

/**
 * The customer confirms an order a seller sent them (ROADMAP.md F-05c). The
 * signed link is the permission; the update itself only moves a waiting order.
 */
export async function confirmOrderFromLink(orderId: string, accessToken: string): Promise<{ success: boolean }> {
  if (typeof orderId !== "string" || typeof accessToken !== "string" || !verifyOrderAccess(orderId, accessToken)) {
    return { success: false };
  }
  try {
    const { confirmed } = await confirmManualOrderLink(orderId);
    if (confirmed) revalidatePath(`/orders/${orderId}`);
    return { success: confirmed };
  } catch (error) {
    console.error("[manual-order] link confirm failed", (error as Error)?.name);
    return { success: false };
  }
}
