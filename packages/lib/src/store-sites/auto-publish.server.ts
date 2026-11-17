/**
 * A new store goes live by itself (owner, 2026-11-17): only a store that was
 * never published (`site_status = 'draft'`), and only when BOTH are true: the
 * seller chose a template AND the store has at least one published product.
 * The two can happen in either order, so this runs after a template is applied
 * and after a product of the store becomes published.
 *
 * The seller's own Publish button and the "Website live" switch do not come
 * here, and a store the seller switched off is never put back online. A store
 * that is live stays live when its last product is hidden or deleted. While the
 * seller's stores are offline for billing (the trial's days are over with no
 * top-up, docs/seller-top-up-rules.md) nothing is published, silently.
 *
 * Server-only. `sellerId` comes from the session (or the verified agent
 * token) and `storeId` is the store the caller already checked;
 * publishStoreSite checks again that the store is that seller's.
 */
import { invalidateStoreSite, type CacheInvalidation } from "@workspace/cache/invalidate";
import { and, db, eq, isNull, stores } from "@workspace/db";
import { logServerError } from "@workspace/db/log";
import { grantWelcomeGiftSafely } from "../store-wallet/welcome-gift.server";
import { publishStoreSite, type BuilderOptions, type PublishError } from "./server";

/** Why a store was left as it is. `not_draft`: it was published before; `failed`: an unexpected error (logged). */
export type AutoPublishSkip = PublishError | "not_draft" | "failed";

export type AutoPublishResult =
  /** The store is live now. The caller applies `invalidation` its own way (server action, route or backend broadcast). */
  | { published: true; invalidation: CacheInvalidation }
  | { published: false; reason: AutoPublishSkip };

export type AutoPublishOptions = BuilderOptions & {
  /**
   * The store's `site_status`, when the caller already read it: anything but
   * `'draft'` returns at once with no query.
   */
  siteStatus?: string | null;
};

/** The normal reasons a store stays offline: nothing to log. */
const EXPECTED: ReadonlySet<AutoPublishSkip> = new Set(["already_published", "template_not_chosen", "no_active_product", "not_draft", "top_up_required"]);

/**
 * Publishes a never-published store when it has a chosen template and a
 * published product, then grants the welcome gift as every first publish does.
 * Never throws and never fails the caller's write. For a store that is already
 * live the cost is one primary-key read.
 */
export async function publishNewStoreIfReady(
  sellerId: string,
  storeId: string,
  publishedBy: string,
  options: AutoPublishOptions = {},
): Promise<AutoPublishResult> {
  const { siteStatus, ...builder } = options;
  if (siteStatus != null && siteStatus !== "draft") return { published: false, reason: "not_draft" };
  try {
    // Unlocked read: most stores are live already and stop here. publishStoreSite decides under its row lock.
    const [store] = await db
      .select({ siteStatus: stores.siteStatus, subdomain: stores.subdomain })
      .from(stores)
      .where(and(eq(stores.id, storeId), eq(stores.sellerId, sellerId), isNull(stores.deletedAt)))
      .limit(1);
    if (!store) return { published: false, reason: "not_found" };
    if (store.siteStatus !== "draft") return { published: false, reason: "not_draft" };

    const result = await publishStoreSite(sellerId, storeId, publishedBy, {
      ...builder,
      requireTemplateChoice: true,
      onlyIfNeverPublished: true,
      requireActiveProduct: true,
      refuseWhenBillingOffline: true,
    });
    if (!result.success) {
      if (!EXPECTED.has(result.error)) {
        logServerError("publish", "auto-publish skipped", { sellerId, storeId, reason: result.error });
      }
      return { published: false, reason: result.error };
    }
    await grantWelcomeGiftSafely(sellerId);
    return { published: true, invalidation: invalidateStoreSite(sellerId, storeId, store.subdomain) };
  } catch (error) {
    logServerError("publish", "auto-publish failed", { sellerId, storeId }, error);
    return { published: false, reason: "failed" };
  }
}
