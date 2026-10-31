import "server-only";

import { and, asc, db, eq, isNull, ne, sellerCustomDomains, storeProducts, stores } from "@workspace/db";
import { storeUrl } from "@workspace/lib/storefront";

/**
 * "View on Site" for a product: its page on one of the seller's stores
 * (`<store>/products/<slug>`, at the store's active custom domain or else its
 * subdomain). The marketplace `/products/<slug>` route no longer exists.
 * A store whose catalog shows the product wins ("selected" mode only shows
 * its picks), a published website first, then the oldest store.
 */
export async function loadProductStoreLink(
  product: { id: string; slug: string | null; sellerId: string | null },
): Promise<string | null> {
  if (!product.slug || !product.sellerId) return null;

  const sellerStores = await db
    .select({
      id: stores.id,
      subdomain: stores.subdomain,
      siteStatus: stores.siteStatus,
      catalogMode: stores.catalogMode,
    })
    .from(stores)
    .where(and(eq(stores.sellerId, product.sellerId), isNull(stores.deletedAt), ne(stores.status, "archived")))
    .orderBy(asc(stores.createdAt));
  if (!sellerStores.length) return null;

  const picks = await db
    .select({ storeId: storeProducts.storeId })
    .from(storeProducts)
    .where(eq(storeProducts.productId, product.id));
  const pickedBy = new Set(picks.map((p) => p.storeId));

  const showing = sellerStores.filter((s) => s.catalogMode !== "selected" || pickedBy.has(s.id));
  const store = showing.find((s) => s.siteStatus === "published") ?? showing[0];
  if (!store) return null;

  const [domain] = await db
    .select({ domain: sellerCustomDomains.domain })
    .from(sellerCustomDomains)
    .where(and(eq(sellerCustomDomains.storeId, store.id), eq(sellerCustomDomains.status, "active")))
    .limit(1);

  return `${storeUrl(store.subdomain, domain?.domain ?? null)}/products/${encodeURIComponent(product.slug)}`;
}
