import { cacheProfiles, createCachedQuery, sellerTags, storeTags } from "@workspace/cache";
import { getPublicStoreForms } from "@workspace/lib/store-forms/server";

/**
 * The active forms a store's published pages embed (a footer newsletter form
 * is on every page), cached per seller and store (CLAUDE.md rule 8). Only the
 * fields and labels: submissions are never cached. Dashboard › Forms edits
 * clear `storeTags.forms`; publishing (which is when a new form id first
 * appears on a page) and store status changes clear the site and profile tags.
 * `formIds` must be sorted and de-duplicated by the caller so the key is stable.
 */
export const getCachedPublicStoreForms = createCachedQuery({
  name: "storefront:public-forms:v1",
  ttl: cacheProfiles.seller,
  tags: (sellerId: string, storeId: string, subdomain: string, _formIds: string[]) => [
    storeTags.forms(sellerId, storeId),
    storeTags.site(sellerId, storeId),
    sellerTags.subdomain(subdomain),
  ],
  query: (_sellerId: string, storeId: string, _subdomain: string, formIds: string[]) => getPublicStoreForms(storeId, formIds),
});
