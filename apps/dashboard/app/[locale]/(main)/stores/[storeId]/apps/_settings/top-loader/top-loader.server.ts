"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { and, db, eq, sql, stores } from "@workspace/db";
import { normalizeTopLoaderInput, type StoreTopLoaderSettings } from "@workspace/lib/stores/top-loader";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Store › Apps › Top loader (owner, 2026-11-27). storeId is explicit and
 * re-checked with requireStore; the input is cleaned again on the server and
 * saved in `stores.settings.topLoader` (other keys kept). The storefront
 * profile carrying it is cached, so the store's hosts are invalidated.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export type StoreTopLoaderResult =
  | { success: true; settings: StoreTopLoaderSettings }
  | { success: false; error: "readOnly" | "notFound" | "rateLimited" | "generic" };

export async function saveStoreTopLoader(storeId: string, input: unknown): Promise<StoreTopLoaderResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-top-loader:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    const settings = normalizeTopLoaderInput(input);
    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('topLoader', ${JSON.stringify(settings)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidateDashboardPath(`/stores/${store.id}/apps/top-loader/settings`);
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true, settings };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-top-loader] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
