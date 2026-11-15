import { asc, db, products, sellerProductBrands, sellerProductCategories, sql } from "@workspace/db";
import { flattenCategoryTree } from "@workspace/lib/store-sites/category-tree";
import { taxonomyInStore, type TaxonomyScope } from "@workspace/lib/stores/scope/server";
import type { SellerTaxonomyItem, SellerTaxonomyOption, TaxonomyKind } from "./categories-brands.dto";

/**
 * One store's list (categories or brands), in its order, with how many
 * products use each item. The scope comes from `requireProductStore` (the
 * session's seller and a store they own, checked): before the catalog split
 * it is the seller's one list (every store shows the same), after it the
 * store's own (`taxonomyInStore`, F-87d). Never cached (seller data).
 *
 * Categories come in tree order (0171): each main category, then its
 * sub-categories; a main category's `productCount` adds its sub-categories'
 * (`ownProductCount` is its own). With no sub-categories this is exactly the
 * position order, as before.
 */
export async function loadSellerTaxonomyList(scope: TaxonomyScope, kind: TaxonomyKind): Promise<SellerTaxonomyItem[]> {
  const { sellerId } = scope;
  if (kind === "category") {
    const rows = await db
      .select({
        id: sellerProductCategories.id,
        parentId: sellerProductCategories.parentId,
        position: sellerProductCategories.position,
        name: sellerProductCategories.name,
        nameAr: sellerProductCategories.nameAr,
        sourceId: sellerProductCategories.sourceCategoryId,
        image: sellerProductCategories.imageUrl,
        // Nested sql keeps the table name on outer columns; a no-join select strips it from a bare field (outer-column.test.ts).
        // After the split a product may only use its own store's category (0163 trigger), so the seller filter is enough.
        ownProductCount: sql<number>`${sql`(SELECT count(*)::int FROM ${products} p WHERE p.seller_category_id = ${sellerProductCategories.id} AND p.seller_id = ${sellerId} AND p.deleted_at IS NULL)`}`,
      })
      .from(sellerProductCategories)
      .where(taxonomyInStore(sellerProductCategories, scope))
      .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.createdAt));
    const flat = flattenCategoryTree(rows);
    const mains = new Set(flat.filter((r) => !r.parentId || !rows.some((p) => p.id === r.parentId && !p.parentId)).map((r) => r.id));
    const childTotals = new Map<string, number>();
    for (const r of flat) {
      if (!mains.has(r.id)) childTotals.set(r.parentId!, (childTotals.get(r.parentId!) ?? 0) + r.ownProductCount);
    }
    return flat.map(({ position: _position, ...r }) => ({ ...r, productCount: r.ownProductCount + (childTotals.get(r.id) ?? 0) }));
  }
  const brandRows = await db
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
  return brandRows.map((r) => ({ ...r, parentId: null, ownProductCount: r.productCount }));
}

/**
 * The store's category list, slim, for the product form's category picker and
 * AI autofill matching, in tree order, each sub-category with its main
 * category's names (for "Main › Sub").
 */
export async function loadSellerTaxonomyOptions(scope: TaxonomyScope): Promise<{ categories: SellerTaxonomyOption[] }> {
  const rows = await db
    .select({
      id: sellerProductCategories.id,
      name: sellerProductCategories.name,
      nameAr: sellerProductCategories.nameAr,
      sourceId: sellerProductCategories.sourceCategoryId,
      parentId: sellerProductCategories.parentId,
      position: sellerProductCategories.position,
    })
    .from(sellerProductCategories)
    .where(taxonomyInStore(sellerProductCategories, scope))
    .orderBy(asc(sellerProductCategories.position), asc(sellerProductCategories.createdAt));
  const byId = new Map(rows.map((r) => [r.id, r]));
  const categories = flattenCategoryTree(rows).map(({ position: _position, ...r }) => {
    const parent = r.parentId ? byId.get(r.parentId) : undefined;
    return { ...r, parentName: parent?.name ?? null, parentNameAr: parent?.nameAr ?? null };
  });
  return { categories };
}
