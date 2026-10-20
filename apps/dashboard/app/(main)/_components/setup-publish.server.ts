"use server";

import { getStoreForEditor } from "@workspace/lib/store-sites/server";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { isAccessError, requireStore } from "@/lib/auth/require-seller.server";
import { publish } from "@/app/(builder)/stores/[storeId]/editor/server/editor.server";

export type PublishFromHomeResult =
  | { success: true; url: string; hostname: string }
  | { success: false; error: string };

/**
 * "Publish your store" on the home checklist: the builder's Publish for one
 * of the session seller's stores (re-checked here and again by `publish`),
 * returning the live address for the celebration dialog.
 */
export async function publishStoreFromHome(storeId: string): Promise<PublishFromHomeResult> {
  try {
    const { store } = await requireStore(String(storeId), { forPublish: true });
    // A store that never opened the builder may still need its draft scaffold.
    await getStoreForEditor(store.sellerId, store.id);
    const result = await publish(store.id);
    if (!result.success) return result;
    const customDomain = await findActiveCustomDomainForSubdomain(store.subdomain);
    return {
      success: true,
      url: storeUrl(store.subdomain, customDomain),
      hostname: storeHostname(store.subdomain, customDomain),
    };
  } catch (error) {
    if (isAccessError(error)) {
      const code = error.code === "store_read_only" ? "readOnly" : error.code === "publish_blocked" ? "publishBlocked" : "notFound";
      return { success: false, error: code };
    }
    console.error("[home] publish failed", (error as Error)?.message);
    return { success: false, error: "generic" };
  }
}
