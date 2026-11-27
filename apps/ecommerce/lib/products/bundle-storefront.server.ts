import {
  bundleAvailability,
  bundleContentItems,
  overlayBundleAvailability,
  type BundleContentItem,
  type BundleLineItem,
  type BundleStockRow,
} from "@workspace/lib/products/bundles";
import { loadBundleItems, type LoadedBundleItem } from "@workspace/lib/products/bundles/server";
import { getPublicUrl } from "@workspace/ui/lib/utils";

/**
 * Product bundles on the store website (0188, ROADMAP.md F-07f;
 * docs/plans/bundles.md §2, §4). Read live after the cached product reads
 * (CLAUDE.md rule 8: stock is never cached), one `loadBundleItems` call per
 * page or cart for every bundle on it. The store is always the request host's
 * (or the cart's), never a client value.
 */

/** How many of a bundle can be sold, from its loaded items: null = unlimited; an item outside the store makes it 0. */
function availabilityOf(storeId: string, items: readonly LoadedBundleItem[] | undefined): number | null {
  if (!items || items.length === 0) return 0;
  return items.some((item) => item.storeId !== storeId) ? 0 : bundleAvailability(items);
}

function availabilityMap(storeId: string, ids: readonly string[], loaded: Map<string, LoadedBundleItem[]>) {
  return new Map(ids.map((id) => [id, availabilityOf(storeId, loaded.get(id))] as const));
}

type PageProduct = BundleStockRow & { relatedProducts?: unknown };

/**
 * The product page's product with bundle stock on it and on its related
 * products, plus `bundleItems` (the "What's in the bundle" block) when it is a
 * bundle. A page without a bundle costs nothing.
 */
export async function withProductPageBundles<T extends PageProduct>(
  storeId: string,
  product: T,
  locale: string,
): Promise<T & { bundleItems?: BundleContentItem[] }> {
  const related = Array.isArray(product.relatedProducts) ? (product.relatedProducts as BundleStockRow[]) : [];
  const ids = [product, ...related].filter((row) => row.isBundle === true).map((row) => row.id);
  if (ids.length === 0) return product;
  const loaded = await loadBundleItems(storeId, ids, { locale });
  const availability = availabilityMap(storeId, ids, loaded);
  const [own] = overlayBundleAvailability([product], availability);
  const ownItems = product.isBundle === true ? (loaded.get(product.id) ?? []).filter((item) => item.storeId === storeId) : null;
  return {
    ...(own as T),
    ...(related.length > 0 && { relatedProducts: overlayBundleAvailability(related, availability) }),
    ...(ownItems && {
      bundleItems: bundleContentItems(ownItems).map((item) => ({
        ...item,
        image: item.image ? getPublicUrl(item.image, "products") || null : null,
      })),
    }),
  };
}

type CartLine = { product?: (BundleStockRow & { storeId?: string | null }) | null };

/**
 * Cart lines with a bundle's live stock on its product (the quantity cap) and
 * `bundleItems` ("Includes: …"). A storefront cart is one store's; a
 * marketplace cart reads each bundle in its own store (one call per store).
 */
export async function withCartBundles<T extends CartLine>(
  items: readonly T[],
  cartStoreId: string | null,
  locale: string,
): Promise<Array<T & { bundleItems?: BundleLineItem[] }>> {
  const byStore = new Map<string, string[]>();
  for (const item of items) {
    const product = item.product;
    if (product?.isBundle !== true) continue;
    const storeId = cartStoreId ?? product.storeId ?? null;
    if (!storeId) continue;
    byStore.set(storeId, [...(byStore.get(storeId) ?? []), product.id]);
  }
  if (byStore.size === 0) return [...items];
  const loadedByStore = new Map(
    await Promise.all([...byStore].map(async ([storeId, ids]) => [storeId, await loadBundleItems(storeId, ids, { locale })] as const)),
  );
  return items.map((item) => {
    const product = item.product;
    if (product?.isBundle !== true) return item;
    const storeId = cartStoreId ?? product.storeId ?? null;
    const loaded = storeId ? loadedByStore.get(storeId) : undefined;
    const own = loaded?.get(product.id) ?? [];
    const [overlaid] = overlayBundleAvailability([product], new Map([[product.id, storeId ? availabilityOf(storeId, own) : 0]]));
    return {
      ...item,
      product: overlaid as T["product"],
      bundleItems: own.map((row) => ({ name: row.name, variantName: row.variantName, quantity: row.quantity })),
    };
  });
}
