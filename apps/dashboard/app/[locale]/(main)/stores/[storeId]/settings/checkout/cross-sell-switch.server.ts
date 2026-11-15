"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreCrossSells } from "@workspace/cache";
import { and, db, eq, stores } from "@workspace/db";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";

/** Store settings › Checkout: the store-wide cross-sell switch (ROADMAP.md F-32c). On by default. */
export async function saveStoreCrossSell(storeId: string, enabled: boolean): Promise<{ success: boolean }> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    await db
      .update(stores)
      .set({ crossSellEnabled: enabled === true, updatedAt: new Date().toISOString() })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));
    await applyInvalidation(invalidateStoreCrossSells(seller.sellerId, [store.id]), { from: "dashboard", mode: "action" });
    revalidatePath(`/stores/${store.id}/settings/checkout`);
    return { success: true };
  } catch (error) {
    if (!isAccessError(error)) console.error("[cross-sell] switch failed", (error as Error)?.name);
    return { success: false };
  }
}
