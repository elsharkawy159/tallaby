import { cacheProfiles, createCachedQuery, storeTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { isStoreAppActive } from "@workspace/lib/billing/apps";

/** The catalog key of the Remove Tallaby badge app (ROADMAP.md F-110). */
const REMOVE_BRANDING_APP = "remove_branding";

/**
 * Whether the store's footer hides the Tallaby credit (ROADMAP.md F-110): the
 * store has the Remove Tallaby badge app active (a live install row). Cached
 * per seller and store; the dashboard's install and remove purge the store's
 * integrations tag (`afterAppChange`). A renewal job that ends a lapsed install
 * purges nothing, so the shorter `listing` TTL bounds how long the credit can
 * stay hidden after it (the job itself runs once a day). The store comes from
 * the request host (`resolveStorefront`), never from a client.
 */
const cachedHidesTallabyCredit = createCachedQuery({
  name: "storefront:remove-branding:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string) => [storeTags.integrations(sellerId, storeId)],
  query: (sellerId: string, storeId: string) => isStoreAppActive(sellerId, storeId, REMOVE_BRANDING_APP),
});

/** False (the credit shows) when the read fails: a paid hide never breaks a page. */
export async function storeHidesTallabyCredit(sellerId: string, storeId: string): Promise<boolean> {
  try {
    return await cachedHidesTallabyCredit(sellerId, storeId);
  } catch (error) {
    logServerError("integration", "remove-branding read failed", { sellerId, storeId }, error);
    return false;
  }
}
