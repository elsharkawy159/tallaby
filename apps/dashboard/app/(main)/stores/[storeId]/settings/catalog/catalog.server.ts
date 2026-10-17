"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStoreCatalog } from "@workspace/cache";
import { setStoreCatalog } from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import type { CatalogErrorKey, CatalogSaveResult } from "./catalog.dto";

const ERRORS: Record<string, CatalogErrorKey> = {
  invalid_input: "invalidInput",
  store_read_only: "readOnly",
  not_found: "notFound",
  empty_selection: "emptySelection",
  invalid_product: "invalidProduct",
};

/**
 * Store settings › Catalog (PLAN.md D24, P4-07). The storeId is explicit and
 * re-checked with requireStore; product ids are checked against the session's
 * seller by setStoreCatalog (and the store_products trigger).
 */
export async function saveStoreCatalog(storeId: string, input: unknown): Promise<CatalogSaveResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    const result = await setStoreCatalog(seller.sellerId, store.id, input as never);
    if (!result.success) return { success: false, error: ERRORS[result.error] ?? "generic" };
    await applyInvalidation(invalidateStoreCatalog(seller.sellerId, store.id, store.subdomain), {
      from: "dashboard",
      mode: "action",
    });
    revalidatePath(`/stores/${store.id}/settings/catalog`);
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[store-catalog] save failed", error);
    return { success: false, error: "generic" };
  }
}
