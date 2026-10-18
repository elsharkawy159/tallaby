"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { updateStoreSettings } from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import type { StoreSettingsResult } from "./store-settings.dto";

/**
 * Store settings › General (PLAN.md §7.3, P3-03). Every call
 * carries the storeId explicitly and re-checks ownership with requireStore;
 * the payload is validated by the strict schemas in @workspace/lib/stores.
 */

async function afterSave(storeId: string, subdomain: string) {
  // The storefront caches the store profile by subdomain; the primary store's
  // values reach it through the 0050 sellers mirror.
  await applyInvalidation(invalidateStorefront([subdomain]), { from: "dashboard", mode: "action" });
  revalidatePath(`/stores/${storeId}/settings`, "layout");
  revalidatePath("/", "layout");
}

function failure(error: unknown): StoreSettingsResult {
  if (isAccessError(error)) {
    return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
  }
  console.error("[store-settings] save failed", error);
  return { success: false, error: "generic" };
}

export async function saveStoreGeneral(storeId: string, input: unknown): Promise<StoreSettingsResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    const result = await updateStoreSettings(seller.sellerId, store.id, input as never);
    if (!result.success) {
      return { success: false, error: result.error === "invalid_input" ? "invalidInput" : result.error === "store_read_only" ? "readOnly" : "notFound" };
    }
    await afterSave(store.id, store.subdomain);
    return { success: true };
  } catch (error) {
    return failure(error);
  }
}
