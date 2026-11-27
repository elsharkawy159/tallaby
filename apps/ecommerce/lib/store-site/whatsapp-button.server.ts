import { cacheProfiles, createCachedQuery, storeTags } from "@workspace/cache";
import { logServerError } from "@workspace/db/log";
import { isStoreAppActive } from "@workspace/lib/billing/apps";
import { WHATSAPP_BUTTON_APP } from "@workspace/lib/stores/whatsapp-button";

/**
 * Whether the store has the WhatsApp button app installed (a live
 * `store_app_installs` row). Same approach as the Remove Tallaby badge read:
 * cached per seller and store, and the dashboard's install and remove purge
 * the store's integrations tag (`afterAppChange`). The store comes from the
 * request host (`resolveStorefront`), never from a client.
 */
const cachedHasWhatsAppButton = createCachedQuery({
  name: "storefront:whatsapp-button:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, storeId: string) => [storeTags.integrations(sellerId, storeId)],
  query: (sellerId: string, storeId: string) => isStoreAppActive(sellerId, storeId, WHATSAPP_BUTTON_APP),
});

/** False (no button) when the read fails: a widget never breaks a page. */
export async function storeHasWhatsAppButton(sellerId: string, storeId: string): Promise<boolean> {
  try {
    return await cachedHasWhatsAppButton(sellerId, storeId);
  } catch (error) {
    logServerError("integration", "whatsapp-button read failed", { sellerId, storeId }, error);
    return false;
  }
}
