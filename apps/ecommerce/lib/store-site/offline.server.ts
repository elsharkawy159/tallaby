import type { Metadata } from "next";
import { isStorefrontOffline, resolveStorefront, type Storefront } from "@/lib/storefront.server";
import { getStoreActivationAccess } from "./activation.server";
import { getStorefrontSite } from "./preview.server";

/**
 * Offline stores: never published (`stores.site_status` = 'draft', every new
 * store) or switched off by the seller ("Website live" off; 'unpublished').
 * Every storefront route of the store shows the "store offline" page instead
 * of its content, and is never indexed. A verified "Preview on my store"
 * session (P4-08) still sees the draft, so the seller can keep building while
 * the store is offline.
 *
 * Also offline: a published store whose seller isn't activated yet (ROADMAP.md
 * F-76), for everyone but the seller's own browser with the store's owner pass
 * (activation.server.ts). The pass never opens a draft or switched-off store.
 */

/** Robots for an offline store: kept out of search entirely. */
export const STORE_OFFLINE_ROBOTS = { index: false, follow: false } as const;

/** Metadata for any page of an offline store (the layout supplies the title). */
export const STORE_OFFLINE_METADATA: Metadata = { robots: STORE_OFFLINE_ROBOTS };

/** Whether this request must show the store-offline page instead of the store. */
export async function isStoreOfflineForRequest(
  store: Pick<Storefront, "id" | "storeId" | "subdomain" | "siteStatus">,
): Promise<boolean> {
  if (!isStorefrontOffline(store)) return (await getStoreActivationAccess(store.id, store.storeId)) === "private";
  const { preview } = await getStorefrontSite(store.id, store.storeId, store.subdomain);
  return preview !== "active";
}

/** The seller's own browser on their not-yet-activated published store: show the "only you" banner (F-76). */
export async function isStoreOwnerPreviewForRequest(
  store: Pick<Storefront, "id" | "storeId" | "siteStatus">,
): Promise<boolean> {
  if (isStorefrontOffline(store)) return false;
  return (await getStoreActivationAccess(store.id, store.storeId)) === "owner_preview";
}

/**
 * For a page under `storefront/[subdomain]`: true when the store is offline
 * for this request. The page then renders nothing (the layout shows the
 * offline page) and must not redirect or 404 on missing builder content.
 */
export async function isSubdomainOfflineForRequest(subdomain: string): Promise<boolean> {
  return isStoreOfflineForRequest(await resolveStorefront(subdomain));
}
