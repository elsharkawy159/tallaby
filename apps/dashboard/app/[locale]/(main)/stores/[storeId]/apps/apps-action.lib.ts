import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreIntegrations, invalidateStoreSizeCharts } from "@workspace/cache";
import { getApp } from "@workspace/apps";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { StoreAppsResult } from "./apps.dto";

/** Shared by the Apps server actions (PLAN.md §9, P7-02 … P7-07). */

export const appsSaveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export function appsAccessError(error: unknown): StoreAppsResult<never> | null {
  if (!isAccessError(error)) return null;
  return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
}

/**
 * Invalidates that store's integrations tag only (plus its size-chart tag when
 * the Size chart app changed: product pages read both) and refreshes the App
 * Center list and, when `appKey` names an app, that app's pages (F-93).
 */
export async function afterAppChange(sellerId: string, storeId: string, appKey?: string): Promise<void> {
  await applyInvalidation(invalidateStoreIntegrations(sellerId, storeId), { from: "dashboard", mode: "action" });
  if (appKey === "size_chart") await applyInvalidation(invalidateStoreSizeCharts(sellerId, storeId), { from: "dashboard", mode: "action" });
  revalidatePath(`/stores/${storeId}/apps`);
  const app = appKey ? getApp(appKey) : null;
  if (app) {
    revalidatePath(`/stores/${storeId}/apps/${app.slug}`);
    revalidatePath(`/stores/${storeId}/apps/${app.slug}/settings`);
  }
}
