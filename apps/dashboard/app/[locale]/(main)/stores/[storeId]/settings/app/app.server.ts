"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Store settings › App (ROADMAP.md F-36e). storeId is explicit and re-checked
 * with requireStore; saved in `stores.settings.app` (other keys kept). The
 * storefront profile is cached, so the store's hosts are invalidated.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export type StoreAppResult =
  | { success: true }
  | { success: false; error: "readOnly" | "notFound" | "rateLimited" | "generic" };

export async function saveStoreAppSettings(
  storeId: string,
  input: { showDownloadButton: boolean },
): Promise<StoreAppResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-app:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const show = input?.showDownloadButton !== false;
    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('app', coalesce(${stores.settings} -> 'app', '{}'::jsonb) || jsonb_build_object('showDownloadButton', ${show}::boolean))`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidatePath(`/stores/${store.id}/settings/app`);
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-app] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
