import { applyInvalidation } from "@workspace/cache";
import { publishNewStoreIfReady, type AutoPublishSkip } from "@workspace/lib/store-sites/auto-publish";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import { revalidateDashboardPath } from "@/lib/i18n/revalidate-dashboard-path.server";

/**
 * A new store goes live by itself only when the seller has chosen a template
 * AND the store has at least one published product (owner, 2026-11-17). The
 * two can happen in either order, so the dashboard asks at both moments:
 * Website › Templates after a template is applied, and every product write
 * that made a product of the store published.
 *
 * Rules are in `publishNewStoreIfReady` (@workspace/lib/store-sites/auto-publish):
 * only a store that was never published, so a live store stays live and a
 * store the seller switched off stays off. It never throws and never fails the
 * caller's write. For a store that is already live the cost is one
 * primary-key read.
 *
 * `sellerId` is the session's seller and `storeId` the store the calling
 * action already checked (`requireStore` / `requireProductStore`), never a
 * client value; the publish checks the store against the seller again.
 * Call it after the product write commits, never inside its transaction.
 */

const ALLOWED = storeSectionRegistry.allowedSections();

export type AutoPublishOutcome = { published: true } | { published: false; reason: AutoPublishSkip };

/** `autoPublishStoreIfReady` with the reason the store stayed as it is (Templates tells the seller what is missing). */
export async function autoPublishStore(sellerId: string, storeId: string, userId: string): Promise<AutoPublishOutcome> {
  try {
    const result = await publishNewStoreIfReady(sellerId, storeId, userId, { allowedSections: ALLOWED });
    if (!result.published) return result;
    await applyInvalidation(result.invalidation, { from: "dashboard", mode: "action" });
    // Website › Overview and the sidebar show the store as live.
    revalidateDashboardPath("/stores/[storeId]/website", "layout");
    return { published: true };
  } catch (error) {
    console.error("[auto-publish] failed", (error as Error)?.message);
    return { published: false, reason: "failed" };
  }
}

/** True when the store went live just now. */
export async function autoPublishStoreIfReady(sellerId: string, storeId: string, userId: string): Promise<boolean> {
  return (await autoPublishStore(sellerId, storeId, userId)).published;
}
