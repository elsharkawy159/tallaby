"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { priceRoundingSchema } from "@workspace/lib/products/price-rounding";
import { setStorePriceRounding } from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { PriceRoundingSaveResult } from "./price-rounding.dto";

const saveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

/**
 * Store settings › General › Round prices (ROADMAP.md F-112a). storeId is
 * explicit and re-checked with requireStore; the rule is validated on the
 * server and saved in `stores.settings.priceRounding` (null removes it).
 * The cached storefront profile holds `stores.settings`, so it is purged.
 */
export async function saveStorePriceRounding(storeId: string, input: unknown): Promise<PriceRoundingSaveResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!saveLimiter.check(`store-price-rounding:${seller.sellerId}`)) return { success: false, error: "rateLimited" };

    let rule = null;
    if (input !== null) {
      const parsed = priceRoundingSchema.safeParse(input);
      if (!parsed.success) return { success: false, error: "invalidInput" };
      rule = parsed.data;
    }

    const result = await setStorePriceRounding(seller.sellerId, seller.userId, store.id, rule);
    if (!result.success) {
      return { success: false, error: result.error === "store_read_only" ? "readOnly" : result.error === "not_found" ? "notFound" : "invalidInput" };
    }

    revalidateDashboardPath(`/stores/${store.id}/settings`);
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    return { success: true, rule: result.data };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-price-rounding] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
