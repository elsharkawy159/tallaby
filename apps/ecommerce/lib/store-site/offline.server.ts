import type { Metadata } from "next";
import { isStorefrontOffline, resolveStorefront, type Storefront } from "@/lib/storefront.server";
import { getStorefrontSite } from "./preview.server";

/**
 * Offline stores: never published (`stores.site_status` = 'draft', every new
 * store) or switched off by the seller ("Website live" off; 'unpublished').
 * Every storefront route of the store shows the "store offline" page instead
 * of its content, and is never indexed. A verified "Preview on my store"
 * session (P4-08) still sees the draft, so the seller can keep building while
 * the store is offline.
 */

/** Robots for an offline store: kept out of search entirely. */
export const STORE_OFFLINE_ROBOTS = { index: false, follow: false } as const;

/** Metadata for any page of an offline store (the layout supplies the title). */
export const STORE_OFFLINE_METADATA: Metadata = { robots: STORE_OFFLINE_ROBOTS };

/** Whether this request must show the store-offline page instead of the store. */
export async function isStoreOfflineForRequest(
  store: Pick<Storefront, "id" | "storeId" | "subdomain" | "siteStatus">,
): Promise<boolean> {
  if (!isStorefrontOffline(store)) return false;
  const { preview } = await getStorefrontSite(store.id, store.storeId, store.subdomain);
  return preview !== "active";
}

/**
 * For a page under `storefront/[subdomain]`: true when the store is offline
 * for this request. The page then renders nothing (the layout shows the
 * offline page) and must not redirect or 404 on missing builder content.
 */
export async function isSubdomainOfflineForRequest(subdomain: string): Promise<boolean> {
  return isStoreOfflineForRequest(await resolveStorefront(subdomain));
}
