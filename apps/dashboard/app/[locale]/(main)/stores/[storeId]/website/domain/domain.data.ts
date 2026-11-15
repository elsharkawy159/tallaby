import { getPrimaryStore, listStoreRedirects, type StoreRow } from "@workspace/lib/stores/server";
import { getCustomDomain, type CustomDomainView } from "@/actions/custom-domain";

/**
 * Data for Website › Domain (P4-14; SEO moved to Website › SEO, 2026-11-09). Every read takes a store already
 * loaded through loadStorePage (ownership checked) and stays scoped to it.
 */

export type DomainTabData = {
  customDomain: CustomDomainView | null;
  /** The live custom domain, if any (the address to share). */
  liveDomain: string | null;
  redirects: { subdomain: string; createdAt: string }[];
  /** For a non-primary store: where custom domains are managed today. */
  primaryStore: { id: string; name: string } | null;
};

export async function loadDomainTab(store: StoreRow): Promise<DomainTabData> {
  const [domainRes, redirects, primary] = await Promise.all([
    getCustomDomain(store.id),
    listStoreRedirects(store.sellerId, store.id),
    store.isPrimary ? Promise.resolve(null) : getPrimaryStore(store.sellerId),
  ]);
  const customDomain = domainRes.success ? domainRes.domain : null;
  return {
    customDomain,
    liveDomain: customDomain?.status === "active" ? customDomain.domain : null,
    redirects,
    primaryStore: primary ? { id: primary.id, name: primary.name } : null,
  };
}

/** The store's live (active) custom domain, or null when it only has its subdomain. */
export async function loadLiveDomain(store: StoreRow): Promise<string | null> {
  const res = await getCustomDomain(store.id);
  return res.success && res.domain?.status === "active" ? res.domain.domain : null;
}
