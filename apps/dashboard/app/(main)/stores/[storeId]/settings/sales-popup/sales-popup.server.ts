"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import { normalizeSalesPopupInput, type StoreSalesPopupSettings } from "@workspace/lib/stores/sales-popup";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Store settings › Sales pop-up (ROADMAP.md F-22b). storeId is explicit and
 * re-checked with requireStore; the input is cleaned again on the server and
 * saved in `stores.settings.salesPopup` (other keys kept). The storefront
 * profile carrying it is cached, so the store's hosts are invalidated.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export type StoreSalesPopupResult =
  | { success: true; settings: StoreSalesPopupSettings }
  | { success: false; error: "readOnly" | "notFound" | "rateLimited" | "generic" };

export async function saveStoreSalesPopup(storeId: string, input: unknown): Promise<StoreSalesPopupResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-sales-popup:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const settings = normalizeSalesPopupInput(input);
    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('salesPopup', ${JSON.stringify(settings)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidatePath(`/stores/${store.id}/settings/sales-popup`);
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true, settings };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-sales-popup] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
