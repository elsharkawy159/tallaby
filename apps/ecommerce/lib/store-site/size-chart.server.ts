import { cacheProfiles, createCachedQuery, productTags, storeTags } from "@workspace/cache";
import { loadProductSizeChart, type ProductSizeChart } from "@workspace/lib/size-charts/server";

/**
 * A product's size chart on its store's product page (ROADMAP.md F-92):
 * cached per seller, store, product and category; the store's size-chart tag
 * (chart, target and app changes), its integrations tag (app install), the
 * product's own tag (its category changed) and the store's products tag (a
 * category moved under another main category) keep it right. The store comes from
 * the request host (`resolveStorefront`), never from a client.
 */
const cachedProductSizeChart = createCachedQuery<[sellerId: string, storeId: string, productId: string, categoryId: string | null], ProductSizeChart | null>({
  name: "storefront:size-chart:v2",
  ttl: cacheProfiles.detail,
  tags: (sellerId: string, storeId: string, productId: string) => [
    storeTags.sizeCharts(sellerId, storeId),
    storeTags.integrations(sellerId, storeId),
    productTags.detail(productId),
    // Category writes (moving a sub-category under another main one, 0171) purge the store's products.
    productTags.store(sellerId, storeId),
  ],
  query: (sellerId: string, storeId: string, productId: string, categoryId: string | null) =>
    loadProductSizeChart({ sellerId, storeId }, { id: productId, categoryId }),
});

/** Null when the store hasn't the app, the product has no chart, or the read fails (the page then shows none). */
export async function getProductSizeChart(
  sellerId: string,
  storeId: string,
  product: { id: string; sellerCategoryId: string | null },
): Promise<ProductSizeChart | null> {
  try {
    return await cachedProductSizeChart(sellerId, storeId, product.id, product.sellerCategoryId ?? null);
  } catch (error) {
    console.error("Size chart failed to load for the product page:", error);
    return null;
  }
}
