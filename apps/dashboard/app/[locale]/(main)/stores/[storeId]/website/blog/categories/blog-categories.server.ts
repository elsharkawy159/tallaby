"use server";

import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";
import { applyInvalidation, invalidateStoreCms } from "@workspace/cache";
import { updateBlogCategories } from "@workspace/lib/cms/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { BLOG_ERRORS, type BlogResult } from "../blog.dto";

/**
 * Website › Blog › Categories actions (owner, 2026-11-27). The store id comes
 * from the page URL and is re-checked with requireStore on every call; the
 * category list lives on this store's blog row only (@workspace/lib/cms), and
 * the op itself is validated there (zod). Purges only this store's CMS tag.
 */

const limiter = createRateLimiter({ limit: 120, windowMs: 10 * 60_000 });

export async function changeBlogCategory(storeId: string, op: unknown): Promise<BlogResult<{ id: string | null }>> {
  try {
    const access = await requireStore(String(storeId), { forWrite: true });
    if (!limiter.check(`blog-categories:${access.seller.sellerId}`)) return { success: false, error: "rateLimited" };
    const result = await updateBlogCategories(access.seller.sellerId, access.store.id, op);
    if (!result.success) return { success: false, error: BLOG_ERRORS[result.error] ?? "generic" };
    await applyInvalidation(invalidateStoreCms(access.seller.sellerId, access.store.id), { from: "dashboard", mode: "action" });
    revalidateDashboardPath(`/stores/${access.store.id}/website/blog`);
    revalidateDashboardPath(`/stores/${access.store.id}/website/blog/categories`);
    return { success: true, data: { id: result.data.id } };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "store_read_only" ? "readOnly" : "notFound" };
    console.error("[store-blog] category action failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
