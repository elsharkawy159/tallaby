"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { updateStoreSeo } from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import type { DomainSeoResult } from "./domain-seo.dto";

/**
 * Website › Domain & SEO › SEO (PLAN.md §7.3, P4-14). The storeId is explicit
 * and ownership is re-checked with requireStore; the payload is validated by
 * the strict storeSeoSchema. Applies at once: only this store's storefront
 * profile tag is invalidated (the storefront layout reads the SEO from it).
 */
export async function saveStoreSeo(storeId: string, input: unknown): Promise<DomainSeoResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    const result = await updateStoreSeo(seller.sellerId, store.id, input as never);
    if (!result.success) {
      const map = { invalid_input: "invalidInput", store_read_only: "readOnly", not_found: "notFound" } as const;
      return { success: false, error: map[result.error] };
    }
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    revalidatePath(`/stores/${store.id}/website/domain`, "layout");
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) {
      return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    }
    console.error("[domain-seo] save failed", error);
    return { success: false, error: "generic" };
  }
}
