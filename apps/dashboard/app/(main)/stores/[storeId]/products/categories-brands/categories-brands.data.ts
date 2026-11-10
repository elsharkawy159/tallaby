import { asc, db, products, sellerProductBrands, sellerProductCategories, sql } from "@workspace/db";
import { taxonomyInStore, type TaxonomyScope } from "@workspace/lib/stores/scope/server";
import type { SellerTaxonomyItem, SellerTaxonomyOption, TaxonomyKind } from "./categories-brands.dto";

/**
 * One store's list (categories or brands), in its order, with how many
 * products use each item. The scope comes from `requireProductStore` (the
 * session's seller and a store they own, checked): before the catalog split
 * it is the seller's one list (every store shows the same), after it the
 * store's own (`taxonomyInStore`, F-87d). Never cached (seller data).
 */
export async function loadSellerTaxonomyList(scope: TaxonomyScope, kind: TaxonomyKind): Promise<SellerTaxonomyItem[]> {
  const { sellerId } = scope;
  if (kind === "category") {
    return db
      .select({
        id: sellerProductCategories.id,
        name: sellerProductCategories.name,
        nameAr: sellerProductCategories.nameAr,
        sourceId: sellerProductCategories.sourceCategoryId,
        image: sellerProductCategories.imageUrl,
        // Nested sql keeps the table name on outer columns; a no-join select strips it from a bare field (outer-column.test.ts).
        // After the split a product may only use its own store's category (0163 trigger), so the seller filter is enough.
        productCount: sql<number>`${sql`(SELECT count(*)::int FROM ${products} p WHERE p.seller_category_id = ${sellerProductCategories.id} AND p.seller_id = ${sellerId} AND p.deleted_at IS NULL)`}`,
      })
      .from(sellerProductCategories)
      .where(taxonomyInStore(sellerProductCategories, scope))
      .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.createdAt));
  }
  return db
    .select({
      id: sellerProductBrands.id,
      name: sellerProductBrands.name,
      nameAr: sellerProductBrands.nameAr,
      sourceId: sellerProductBrands.sourceBrandId,
      image: sellerProductBrands.logoUrl,
      // Nested sql keeps the table name on outer columns; a no-join select strips it from a bare field (outer-column.test.ts).
      productCount: sql<number>`${sql`(SELECT count(*)::int FROM ${products} p WHERE p.seller_brand_id = ${sellerProductBrands.id} AND p.seller_id = ${sellerId} AND p.deleted_at IS NULL)`}`,
    })
    .from(sellerProductBrands)
    .where(taxonomyInStore(sellerProductBrands, scope))
    .orderBy(asc(sellerProductBrands.position), asc(sellerProductBrands.createdAt));
}

/** The store's category list, slim, for the product form's category picker and AI autofill matching. */
export async function loadSellerTaxonomyOptions(scope: TaxonomyScope): Promise<{ categories: SellerTaxonomyOption[] }> {
  const categories = await db
    .select({
      id: sellerProductCategories.id,
      name: sellerProductCategories.name,
      nameAr: sellerProductCategories.nameAr,
      sourceId: sellerProductCategories.sourceCategoryId,
    })
    .from(sellerProductCategories)
    .where(taxonomyInStore(sellerProductCategories, scope))
    .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.createdAt));
  return { categories };
}
