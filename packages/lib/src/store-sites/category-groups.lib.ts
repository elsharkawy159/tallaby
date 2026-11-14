/**
 * The store's category groups in tree order (ROADMAP.md F-95, 0171): the
 * pure part of `storeCategoryGroups`, after its SQL. A main category covers
 * its own products plus its sub-categories' (counts, product ids, Tallaby
 * category ids and the photo roll up), and a main category whose products all
 * sit in its sub-categories is still listed. With no parents this returns the
 * SQL rows unchanged, in the same order.
 */
import { categoryParentChain, categoryWithChildren, flattenCategoryTree } from "./category-tree.lib";

export type StoreCategoryGroup = {
  /** Catalog filter key: the seller category id, else the Tallaby root's slug (or id). */
  key: string;
  /** The seller's own category (0068); null for a Tallaby root group. */
  sellerCategoryId: string | null;
  /** The Tallaby category the seller category was picked from. */
  sourceCategoryId: string | null;
  name: string | null;
  nameAr: string | null;
  /** Its products, plus its sub-categories' for a main category. */
  productCount: number;
  /** The Tallaby categories (`products.category_id`) of the products in it (and in its sub-categories). */
  categoryIds: string[];
  /**
   * Its products; a main category's list also holds its sub-categories'
   * (they come later in the list, so a product → group map built in list
   * order ends on the product's own category).
   */
  productIds: string[];
  /**
   * The latest `updated_at` of its products (and its sub-categories'), as
   * UTC "YYYY-MM-DDTHH:MM:SSZ": the store sitemap's lastmod for its page.
   */
  lastProductUpdatedAt?: string | null;
  /** Storage path in the `categories` bucket: the seller's own category photo. */
  ownImage: string | null;
  /** First image entry (a path or `{ url }`) of the best-rated product in it (or in its sub-categories). */
  productImage: unknown;
  /** Its main category's key when it is a sub-category shown here; null otherwise (and for Tallaby root groups). */
  parentKey: string | null;
  /** Its sub-categories shown here (those with products), in tree order; empty for the rest. */
  childKeys: string[];
};

/** One row of the `storeCategoryGroups` SQL (a group with its own products). */
export type CategoryGroupRow = Omit<StoreCategoryGroup, "parentKey" | "childKeys"> & {
  /** The seller category's main category (`spc.parent_id`). */
  parentId: string | null;
  position: number | null;
  /** `created_at` of the seller category, as epoch seconds (order ties). */
  createdAt: number | null;
  /** Rating and `created_at` (epoch seconds) of the product `productImage` came from. */
  bestRating: number | string | null;
  bestCreatedAt: number | null;
  /** The main category's own fields, for a main category with no products of its own. */
  parentSourceCategoryId: string | null;
  parentName: string | null;
  parentNameAr: string | null;
  parentImage: string | null;
  parentPosition: number | null;
  parentCreatedAt: number | null;
};

type Item = CategoryGroupRow & { sellerCategoryId: string };

const num = (value: unknown): number | null => {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

/** Best photo first: higher rating (nulls last), then the newer product. */
function betterImage(a: Item, b: Item): Item {
  if (b.productImage == null) return a;
  if (a.productImage == null) return b;
  const ra = num(a.bestRating);
  const rb = num(b.bestRating);
  if (ra !== rb) {
    if (ra == null) return b;
    if (rb == null) return a;
    return rb > ra ? b : a;
  }
  return (num(b.bestCreatedAt) ?? 0) > (num(a.bestCreatedAt) ?? 0) ? b : a;
}

function strip(item: CategoryGroupRow, parentKey: string | null, childKeys: string[]): StoreCategoryGroup {
  return {
    key: item.key,
    sellerCategoryId: item.sellerCategoryId,
    sourceCategoryId: item.sourceCategoryId,
    name: item.name,
    nameAr: item.nameAr,
    productCount: item.productCount,
    categoryIds: item.categoryIds,
    productIds: item.productIds,
    lastProductUpdatedAt: item.lastProductUpdatedAt,
    ownImage: item.ownImage,
    productImage: item.productImage,
    parentKey,
    childKeys,
  };
}

/**
 * Seller categories in tree order (main, its sub-categories, next main…),
 * then the Tallaby root groups in the SQL's order. Rows come ordered as the
 * SQL reads them: seller categories by (position, created_at), roots by size.
 */
export function shapeStoreCategoryGroups(rows: readonly CategoryGroupRow[]): StoreCategoryGroup[] {
  const seller = rows.filter((row): row is Item => row.sellerCategoryId != null);
  const roots = rows.filter((row) => row.sellerCategoryId == null);
  if (!seller.some((row) => row.parentId)) return rows.map((row) => strip(row, null, []));

  // A main category with no products of its own: built from its sub-categories' rows.
  const present = new Set(seller.map((row) => row.sellerCategoryId));
  const added = new Map<string, Item>();
  for (const row of seller) {
    if (!row.parentId || present.has(row.parentId) || added.has(row.parentId) || row.parentName == null) continue;
    added.set(row.parentId, {
      key: row.parentId,
      sellerCategoryId: row.parentId,
      sourceCategoryId: row.parentSourceCategoryId,
      name: row.parentName,
      nameAr: row.parentNameAr,
      productCount: 0,
      categoryIds: [],
      productIds: [],
      ownImage: row.parentImage?.trim() || null,
      productImage: null,
      parentId: null,
      position: row.parentPosition,
      createdAt: row.parentCreatedAt,
      bestRating: null,
      bestCreatedAt: null,
      parentSourceCategoryId: null,
      parentName: null,
      parentNameAr: null,
      parentImage: null,
      parentPosition: null,
      parentCreatedAt: null,
    });
  }

  // (position, created_at), as the SQL orders; a stable sort keeps the SQL's own ties.
  const items = [...seller, ...added.values()].sort(
    (a, b) => (a.position ?? 0) - (b.position ?? 0) || (num(a.createdAt) ?? 0) - (num(b.createdAt) ?? 0),
  );
  const tree = items.map((item) => ({ id: item.sellerCategoryId, parentId: item.parentId, position: item.position ?? 0 }));
  const byId = new Map(items.map((item) => [item.sellerCategoryId, item]));

  const out: StoreCategoryGroup[] = [];
  for (const node of flattenCategoryTree(tree)) {
    const item = byId.get(node.id)!;
    const chain = categoryParentChain(node.id, tree);
    const parentKey = chain.length > 1 ? (byId.get(chain[1]!)?.key ?? null) : null;
    const childIds = parentKey ? [] : categoryWithChildren(node.id, tree).slice(1);
    if (!childIds.length) {
      if (item.productCount > 0) out.push(strip(item, parentKey, []));
      continue;
    }
    const children = childIds.map((id) => byId.get(id)!);
    const productIds = [...new Set([...item.productIds, ...children.flatMap((c) => c.productIds)])];
    const categoryIds = [...new Set([...item.categoryIds, ...children.flatMap((c) => c.categoryIds)])];
    const best = children.reduce(betterImage, item);
    // Fixed-width UTC strings: the greatest one is the latest.
    const updated = [item, ...children].map((c) => c.lastProductUpdatedAt).filter((t): t is string => Boolean(t));
    out.push({
      ...strip(item, null, children.map((c) => c.key)),
      productCount: productIds.length,
      productIds,
      lastProductUpdatedAt: updated.length ? updated.reduce((a, b) => (b > a ? b : a)) : undefined,
      categoryIds,
      productImage: best.productImage ?? null,
    });
  }
  return [...out, ...roots.map((row) => strip(row, null, []))];
}
