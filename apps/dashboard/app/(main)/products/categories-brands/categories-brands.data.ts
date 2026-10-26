import { asc, db, eq, products, sellerProductBrands, sellerProductCategories, sql } from "@workspace/db";
import type { SellerTaxonomyItem, SellerTaxonomyOption, TaxonomyKind } from "./categories-brands.dto";

/**
 * One of the seller's own lists (categories or brands), in their order, with
 * how many of their products use each item. Always filtered by the session's
 * seller; never cached (seller data).
 */
export async function loadSellerTaxonomyList(sellerId: string, kind: TaxonomyKind): Promise<SellerTaxonomyItem[]> {
  if (kind === "category") {
    return db
      .select({
        id: sellerProductCategories.id,
        name: sellerProductCategories.name,
        nameAr: sellerProductCategories.nameAr,
        sourceId: sellerProductCategories.sourceCategoryId,
        image: sellerProductCategories.imageUrl,
        productCount: sql<number>`(SELECT count(*)::int FROM ${products} p WHERE p.seller_category_id = ${sellerProductCategories.id} AND p.seller_id = ${sellerId})`,
      })
      .from(sellerProductCategories)
      .where(eq(sellerProductCategories.sellerId, sellerId))
      .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.createdAt));
  }
  return db
    .select({
      id: sellerProductBrands.id,
      name: sellerProductBrands.name,
      nameAr: sellerProductBrands.nameAr,
      sourceId: sellerProductBrands.sourceBrandId,
      image: sellerProductBrands.logoUrl,
      productCount: sql<number>`(SELECT count(*)::int FROM ${products} p WHERE p.seller_brand_id = ${sellerProductBrands.id} AND p.seller_id = ${sellerId})`,
    })
    .from(sellerProductBrands)
    .where(eq(sellerProductBrands.sellerId, sellerId))
    .orderBy(asc(sellerProductBrands.position), asc(sellerProductBrands.createdAt));
}

/** The seller's category list, slim, for the product form's category picker. */
export async function loadSellerTaxonomyOptions(sellerId: string): Promise<{ categories: SellerTaxonomyOption[] }> {
  const categories = await db
    .select({
      id: sellerProductCategories.id,
      name: sellerProductCategories.name,
      nameAr: sellerProductCategories.nameAr,
      sourceId: sellerProductCategories.sourceCategoryId,
    })
    .from(sellerProductCategories)
    .where(eq(sellerProductCategories.sellerId, sellerId))
    .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.createdAt));
  return { categories };
}
