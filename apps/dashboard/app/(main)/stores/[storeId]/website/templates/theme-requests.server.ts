"use server";

import { countOpenThemeRequests, createThemeRequest, listSellerThemeRequests } from "@workspace/lib/theme-requests/server";
import { isAccessError, requireSeller, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import type { ThemeRequestActionResult, ThemeRequestsView } from "./theme-requests.dto";
import { MAX_OPEN_THEME_REQUESTS } from "@workspace/lib/theme-requests";

/**
 * Website › Templates › "Request a theme" (ROADMAP.md F-77, 0156). The
 * seller comes from the session and the store id is re-checked with
 * requireStore (never trusted from the client). Requests belong to the seller
 * account, so the list shows every store's requests.
 */

const submitLimiter = createRateLimiter({ limit: 6, windowMs: 10 * 60_000 });

export async function submitThemeRequest(storeId: string, input: unknown): Promise<ThemeRequestActionResult<{ id: string }>> {
  try {
    const access = await requireStore(String(storeId), { forWrite: true });
    if (!submitLimiter.check(`theme-request:${access.seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await createThemeRequest({
      sellerId: access.seller.sellerId,
      storeId: access.store.id,
      actorId: access.seller.userId,
      input,
    });
    if (!result.success) {
      const error = result.error === "too_many_open" ? "tooManyOpen" : result.error === "invalid_image" ? "invalidImage" : "invalid";
      return { success: false, error };
    }
    return { success: true, data: { id: result.id } };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[theme-requests] submit failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}

/** Read-only: the seller's requests and how many are still open. */
export async function listMyThemeRequests(): Promise<ThemeRequestActionResult<ThemeRequestsView>> {
  try {
    const seller = await requireSeller();
    const [items, openCount] = await Promise.all([listSellerThemeRequests(seller.sellerId), countOpenThemeRequests(seller.sellerId)]);
    return { success: true, data: { items, openCount, maxOpen: MAX_OPEN_THEME_REQUESTS } };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[theme-requests] list failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
