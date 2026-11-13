import { db, products } from "@workspace/db";
import { sql } from "drizzle-orm";
import { productInStoreOf } from "@workspace/lib/stores/scope/server";
import type { OrderLock } from "@workspace/lib/billing/order-grace";
import { requireSeller } from "@/lib/auth/require-seller.server";
import { isSwitchOn } from "@/lib/stores/platform-switches.server";
import { graceNoticeNeedsStoreCheck } from "./grace-notice.lib";

const rowsOf = <T,>(result: unknown): T[] =>
  (Array.isArray(result) ? result : ((result as { rows?: T[] }).rows ?? [])) as T[];

/**
 * The seller has a store that is published (`site_status = 'published'`, the
 * `publish` setup flag) AND has an active, not trashed product in that same
 * store (the `product` setup flag, store-setup.server.ts, same
 * `productInStoreOf` scope `managed` as the setup reminder emails). One EXISTS
 * read. `sellerId` is always the session's seller, never a client value.
 */
export async function hasLiveStoreWithProduct(sellerId: string): Promise<boolean> {
  const catalogSplit = await isSwitchOn("stores_catalog_split");
  const inStore = productInStoreOf(sql`st.id`, { catalogSplit, scope: "managed" });
  const result = await db.execute(sql`
    SELECT EXISTS (
      SELECT 1 FROM stores st
       WHERE st.seller_id = ${sellerId}::uuid
         AND st.deleted_at IS NULL
         AND st.site_status = 'published'
         AND EXISTS (
           SELECT 1 FROM ${products}
            WHERE ${products.sellerId} = st.seller_id
              AND ${products.status} = 'active'
              AND ${products.deletedAt} IS NULL
              AND ${inStore}
         )
    ) AS ready
  `);
  return Boolean(rowsOf<{ ready: unknown }>(result)[0]?.ready);
}

/**
 * `storeReady` for OrdersGraceNotice, for the session seller. The read runs only
 * when the notice depends on it (open window, no first order yet), so activated
 * and locked sellers pay nothing. Chain it on the lock promise to run it beside
 * the page's other loads.
 */
export async function currentGraceNoticeStoreReady(lock: OrderLock): Promise<boolean> {
  if (!graceNoticeNeedsStoreCheck(lock)) return false;
  const { sellerId } = await requireSeller();
  return hasLiveStoreWithProduct(sellerId);
}
