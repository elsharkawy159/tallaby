import { and, db, eq, inArray, sellerCustomDomains, storeProducts, stores as storesTable } from "@workspace/db";
import { storeUrl } from "@workspace/lib/storefront";
import { getSellerStores } from "@/lib/stores/current-store.server";
import { requireSeller } from "@/lib/auth/require-seller.server";

/**
 * Where "Open product" goes for each product: the product page on the
 * seller's own store, at its active custom domain or else its subdomain.
 * The selected store comes first, then the seller's other stores, and the
 * first one whose catalog shows the product wins (a store in "selected"
 * catalog mode only shows its picks). Products no store shows get no link.
 */
export async function loadProductStoreLinks(
  products: { id: string; slug: string | null }[],
): Promise<Map<string, string>> {
  const links = new Map<string, string>();
  if (!products.some((p) => p.slug)) return links;

  const [seller, { stores, selected }] = await Promise.all([requireSeller(), getSellerStores()]);
  const candidates = [selected, ...stores.filter((s) => s.id !== selected?.id)].filter(
    (s): s is NonNullable<typeof s> => Boolean(s) && s!.status !== "archived",
  );
  if (!candidates.length) return links;
  const ids = candidates.map((s) => s.id);

  const [modes, domains] = await Promise.all([
    db
      .select({ id: storesTable.id, catalogMode: storesTable.catalogMode })
      .from(storesTable)
      .where(and(eq(storesTable.sellerId, seller.sellerId), inArray(storesTable.id, ids))),
    db
      .select({ storeId: sellerCustomDomains.storeId, domain: sellerCustomDomains.domain })
      .from(sellerCustomDomains)
      .where(and(eq(sellerCustomDomains.sellerId, seller.sellerId), eq(sellerCustomDomains.status, "active"))),
  ]);
  const selectedMode = new Set(modes.filter((m) => m.catalogMode === "selected").map((m) => m.id));
  const picks = selectedMode.size
    ? await db
        .select({ storeId: storeProducts.storeId, productId: storeProducts.productId })
        .from(storeProducts)
        .where(inArray(storeProducts.storeId, [...selectedMode]))
    : [];
  const picked = new Set(picks.map((p) => `${p.storeId}:${p.productId}`));
  const domainByStore = new Map(domains.map((d) => [d.storeId, d.domain]));

  for (const product of products) {
    if (!product.slug) continue;
    const store = candidates.find((s) => !selectedMode.has(s.id) || picked.has(`${s.id}:${product.id}`));
    if (!store) continue;
    const base = storeUrl(store.subdomain, domainByStore.get(store.id) ?? null);
    links.set(product.id, `${base}/products/${encodeURIComponent(product.slug)}`);
  }
  return links;
}
