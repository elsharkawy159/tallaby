import type { ProductSummary } from "@workspace/store-sections/render";
import {
  CATALOG_SHARE_MAX_PRODUCTS,
  orderCatalogRows,
  verifyCatalogShare,
  type CatalogShareSource,
} from "@workspace/lib/catalog-share";
import { catalogShareKey } from "@workspace/lib/catalog-share/server";
import { getProducts } from "@/actions/products";
import type { ProductLocale } from "@/lib/product-translations";
import { toProductSummaries } from "@/lib/store-site/catalog.server";
import {
  catalogStoreId,
  getStorefrontCategories,
  storeCategoryFilter,
  type Storefront,
} from "@/lib/storefront.server";

/**
 * A shared catalog link on a store host (ROADMAP.md F-11c). The store is the
 * one the request HOST serves (the caller resolves it); the token must be
 * signed for that store's seller AND name that store, else it is no catalog.
 * Products come from `getProducts` (cached per seller, with the store's
 * catalog tags): only this seller's active products, only the store's picks
 * in selected catalog mode. Trashed products are drafts (0123), so they never
 * show. Nothing here is written; the token is the whole catalog.
 */

export type SharedCatalog = {
  title: string | null;
  source: CatalogShareSource["kind"];
  /** The store category's name, for a category catalog. */
  categoryName: string | null;
  products: ProductSummary[];
  /** Products that need a variant choice: their button opens the product page. */
  withVariants: Set<string>;
};

/** The catalog a token names on this store, or null (bad token, other store, missing key). */
export async function resolveSharedCatalog(store: Storefront, token: string, locale: string): Promise<SharedCatalog | null> {
  let key: Buffer;
  try {
    key = catalogShareKey();
  } catch (error) {
    console.error("[catalog-share] signing key unavailable:", (error as Error).message);
    return null;
  }
  const payload = verifyCatalogShare(token, store.id, key);
  if (!payload || payload.storeId !== store.storeId.toLowerCase()) return null;

  const selected = catalogStoreId(store);
  const base = { sellerId: store.id, catalogStoreId: selected, locale: locale as ProductLocale, limit: CATALOG_SHARE_MAX_PRODUCTS };
  let categoryName: string | null = null;
  let rows: unknown[] = [];

  if (payload.source.kind === "products") {
    const result = await getProducts({ ...base, productIds: payload.source.productIds });
    const found = (result.success ? (result.data ?? []) : []) as unknown as { id: string }[];
    rows = orderCatalogRows(found, payload.source.productIds);
  } else if (payload.source.kind === "category") {
    const key = payload.source.categoryKey;
    const category = (await getStorefrontCategories(store.id, selected)).find((c) => c.key === key);
    if (category) {
      categoryName = (locale === "ar" ? category.nameAr || category.name : category.name || category.nameAr) ?? null;
      const result = await getProducts({ ...base, storeCategory: storeCategoryFilter(category), sortBy: "newest" });
      rows = result.success ? (result.data ?? []) : [];
    }
  } else {
    const result = await getProducts({ ...base, sortBy: "newest" });
    rows = result.success ? (result.data ?? []) : [];
  }

  const { products, withVariants } = toProductSummaries(rows);
  return { title: payload.title, source: payload.source.kind, categoryName, products, withVariants };
}
