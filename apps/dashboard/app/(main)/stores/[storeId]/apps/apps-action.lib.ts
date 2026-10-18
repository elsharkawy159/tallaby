import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreIntegrations } from "@workspace/cache";
import { isAccessError } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { StoreAppsResult } from "./apps.dto";

/** Shared by the Apps server actions (PLAN.md §9, P7-02 … P7-07). */

export const appsSaveLimiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export function appsAccessError(error: unknown): StoreAppsResult<never> | null {
  if (!isAccessError(error)) return null;
  return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
}

/** Invalidates that store's integrations tag only and refreshes the Apps page. */
export async function afterAppChange(sellerId: string, storeId: string): Promise<void> {
  await applyInvalidation(invalidateStoreIntegrations(sellerId, storeId), { from: "dashboard", mode: "action" });
  revalidatePath(`/stores/${storeId}/apps`);
}
