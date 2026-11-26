import { cache } from "react";
import { storeHostname, storeUrl } from "@workspace/lib/storefront";
import { findActiveCustomDomainForSubdomain } from "@workspace/lib/storefront/server";
import { getSellerStores } from "./current-store.server";

/** `href` opens the store through /api/stores/<id>/view (a redirect to its address); `url` is the address to show or copy. */
export type StoreLink = { url: string; host: string; href: string };

/**
 * A store address's active custom domain, read once per request per subdomain:
 * the header link (the selected store's subdomain) and getSiteData
 * (`sellers.subdomain`) usually ask for the same one. Per request only (React
 * cache()), never across requests.
 */
export const findCustomDomainForSubdomain = cache((subdomain: string) => findActiveCustomDomainForSubdomain(subdomain));

/**
 * Public address of the store selected in the sidebar (its active custom
 * domain, else {subdomain}.tallaby.com), for the header and home greeting links.
 * Display only: getSellerStores only ever returns this seller's stores.
 */
export const getSelectedStoreLink = cache(async (): Promise<StoreLink | null> => {
  const { selected } = await getSellerStores();
  if (!selected?.subdomain) return null;
  const customDomain = await findCustomDomainForSubdomain(selected.subdomain).catch(() => null);
  return {
    url: storeUrl(selected.subdomain, customDomain),
    href: `/api/stores/${selected.id}/view`,
    host: storeHostname(selected.subdomain, customDomain),
  };
});
