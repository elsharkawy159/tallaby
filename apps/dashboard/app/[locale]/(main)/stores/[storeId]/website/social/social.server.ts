"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateStorefront } from "@workspace/cache";
import { updateStoreSocialLinks } from "@workspace/lib/stores/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { SocialSaveResult } from "./social.dto";

/**
 * Website › Social media (PLAN.md §8.8, P4-15). The store id is explicit and
 * re-checked with requireStore; the list is validated and normalized by
 * @workspace/lib (strict schema, platform domains only). Links apply at once
 * (no publish): only this store's storefront profile is invalidated.
 */

const limiter = createRateLimiter({ limit: 30, windowMs: 10 * 60_000 });

export async function saveStoreSocial(storeId: string, links: unknown): Promise<SocialSaveResult> {
  try {
    const { seller, store } = await requireStore(String(storeId), { forWrite: true });
    if (!limiter.check(`social:${seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await updateStoreSocialLinks(seller.sellerId, store.id, links);
    if (!result.success) {
      return { success: false, error: result.error === "invalid_input" ? "invalidInput" : result.error === "store_read_only" ? "readOnly" : "notFound" };
    }
    await applyInvalidation(invalidateStorefront([store.subdomain]), { from: "dashboard", mode: "action" });
    revalidatePath(`/stores/${store.id}/website/social`);
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[website-social] save failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
