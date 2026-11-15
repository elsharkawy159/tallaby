"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import type { StoreMinOrder } from "@workspace/lib/stores/min-order";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { parseStoreMinOrderInput, type StoreMinOrderInputError } from "./min-order.dto";

/**
 * Store settings › Checkout › Minimum order (ROADMAP.md F-13b). storeId is
 * explicit and re-checked with requireStore; the input is validated on the
 * server and saved in `stores.settings.minOrder` (other keys kept). Checkout
 * reads it fresh; the cart shows it from the cached storefront profile, so
 * the store's hosts are invalidated.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export type StoreMinOrderResult =
  | { success: true; minOrder: StoreMinOrder }
  | { success: false; error: "readOnly" | "notFound" | "rateLimited" | "generic" | StoreMinOrderInputError };

export async function saveStoreMinOrder(storeId: string, input: unknown): Promise<StoreMinOrderResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-min-order:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const parsed = parseStoreMinOrderInput(input);
    if (!parsed.ok) return { success: false, error: parsed.error };
    const minOrder = parsed.value;

    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('minOrder', ${JSON.stringify(minOrder)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidatePath(`/stores/${store.id}/settings/checkout`);
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true, minOrder };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-min-order] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
