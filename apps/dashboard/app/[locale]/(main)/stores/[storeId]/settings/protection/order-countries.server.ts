"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { and, db, eq, sql, stores } from "@workspace/db";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Store settings › Order protection › Orders from my country only (ROADMAP.md
 * F-115 A5). storeId is explicit and re-checked with requireStore; only a
 * boolean is saved, in `stores.settings.orderCountries` (other keys kept).
 * Checkout reads it fresh, so no storefront cache is purged.
 */

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export type StoreOrderCountriesResult =
  | { success: true; enabled: boolean }
  | { success: false; error: "readOnly" | "notFound" | "rateLimited" | "generic" };

export async function saveStoreOrderCountries(storeId: string, enabled: unknown): Promise<StoreOrderCountriesResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-order-countries:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const value = { enabled: enabled === true };

    await db
      .update(stores)
      .set({
        settings: sql`coalesce(${stores.settings}, '{}'::jsonb) || jsonb_build_object('orderCountries', ${JSON.stringify(value)}::jsonb)`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(stores.id, store.id), eq(stores.sellerId, seller.sellerId)));

    revalidateDashboardPath(`/stores/${store.id}/settings/protection`);
    return { success: true, enabled: value.enabled };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-order-countries] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
