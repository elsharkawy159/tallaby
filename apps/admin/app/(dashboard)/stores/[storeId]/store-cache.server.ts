"use server";

import { applyInvalidation, invalidateWholeStore } from "@workspace/cache";
import { and, db, eq, products } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { getStoreForAdmin } from "@workspace/lib/admin/server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { adminActorId, type AdminActionResult } from "../../_lib/saas-admin.server";

/** Plenty for any real store; a bigger catalog still gets its store-wide tags. */
const MAX_PRODUCT_TAGS = 5000;

const limiter = createRateLimiter({ limit: 20, windowMs: 10 * 60_000 });

/**
 * "Refresh cache" on the store page: clears every storefront cache of this one
 * store (design, pages, products, categories, profile, domains) in all apps,
 * for after its design or products were changed straight in the database.
 * Changes no data. The store and its seller come from the database by the
 * store id (never from the client), and only an admin may run it.
 */
export async function refreshStoreCacheAction(storeId: unknown): Promise<AdminActionResult> {
  const actorId = await adminActorId("canManageUsers");
  if (!actorId) return { success: false, error: "Only admins can do this." };
  if (!limiter.check(`admin-store-cache:${actorId}`)) {
    return { success: false, error: "Too many refreshes in a short time. Try again in a few minutes." };
  }

  try {
    const store = await getStoreForAdmin(String(storeId));
    if (!store) return { success: false, error: "This store no longer exists." };
    const rows = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.storeId, store.id), eq(products.sellerId, store.sellerId)))
      .limit(MAX_PRODUCT_TAGS);
    await applyInvalidation(
      invalidateWholeStore({
        sellerId: store.sellerId,
        storeId: store.id,
        subdomain: store.subdomain,
        domains: store.domains.map((d) => d.domain),
        productIds: rows.map((r) => r.id),
      }),
      { from: "admin", mode: "action" },
    );
    return { success: true, message: "Store cache cleared. Visitors see the latest design and products now." };
  } catch (error) {
    logServerError("admin", "refresh store cache failed", { storeId: String(storeId) }, error);
    return { success: false, error: "Something went wrong. Try again." };
  }
}
