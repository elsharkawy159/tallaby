import { applyInvalidation } from "@workspace/cache";
import { and, db, eq, stores } from "@workspace/db";
import { publishNewStoreIfReady, type AutoPublishSkip } from "@workspace/lib/store-sites/auto-publish";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import type { LiveSite } from "@/app/[locale]/(main)/_components/publish-celebration.client";
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
 *
 * When the store went live, the result carries its live site (URL and
 * hostname, read here on the server) so the page can show the "Your store is
 * live!" dialog (`announceStoreLive`, owner 2026-11-18).
 */

const ALLOWED = storeSectionRegistry.allowedSections();

export type AutoPublishOutcome =
  /** `live` is null only when the store's link could not be read (the store is live all the same). */
  | { published: true; live: LiveSite | null }
  | { published: false; reason: AutoPublishSkip };

/** The live site of the seller's store: its own domain once one is active, else its subdomain. Never throws. */
async function loadLiveSite(sellerId: string, storeId: string): Promise<LiveSite | null> {
  try {
    const [row] = await db
      .select({ subdomain: stores.subdomain })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId)))
      .limit(1);
    if (!row?.subdomain) return null;
    const customDomain = await findActiveCustomDomainForSubdomain(row.subdomain).catch(() => null);
    return { url: storeUrl(row.subdomain, customDomain), hostname: storeHostname(row.subdomain, customDomain) };
  } catch (error) {
    console.error("[auto-publish] live site read failed", (error as Error)?.message);
    return null;
  }
}

/** `autoPublishStoreIfReady` with the reason the store stayed as it is (Templates tells the seller what is missing). */
export async function autoPublishStore(sellerId: string, storeId: string, userId: string): Promise<AutoPublishOutcome> {
  try {
    const result = await publishNewStoreIfReady(sellerId, storeId, userId, { allowedSections: ALLOWED });
    if (!result.published) return result;
    await applyInvalidation(result.invalidation, { from: "dashboard", mode: "action" });
    // Website › Overview and the sidebar show the store as live.
    revalidateDashboardPath("/stores/[storeId]/website", "layout");
    return { published: true, live: await loadLiveSite(sellerId, storeId) };
  } catch (error) {
    console.error("[auto-publish] failed", (error as Error)?.message);
    return { published: false, reason: "failed" };
  }
}

/** The store's live site when it went live just now, else null. */
export async function autoPublishStoreIfReady(sellerId: string, storeId: string, userId: string): Promise<LiveSite | null> {
  const outcome = await autoPublishStore(sellerId, storeId, userId);
  return outcome.published ? outcome.live : null;
}
