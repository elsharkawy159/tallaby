/**
 * Which products a product query shows, as one pure rule (P4B-05). The
 * editor canvas runs it on the catalog it loaded; the storefront resolver
 * implements the same rules in SQL, and tests hold both to this file.
 *
 * Nothing here is random or invented: best sellers and trending need units
 * sold, discounted needs a list price above the selling price, and a product
 * with no sales simply isn't a best seller.
 */
import type { CatalogQuery, ProductSort } from "./types";

export type ProductCandidate = {
  id: string;
  /** ISO date the product was added. */
  createdAt: string;
  isFeatured: boolean;
  categoryId: string | null;
  price: number | null;
  compareAtPrice: number | null;
  rating?: number | null;
  /** Units sold in this store's orders over the best-seller window (90 days). */
  sold90?: number;
  /** Units sold over the trending window (14 days). */
  sold14?: number;
};

type ProductQuery = Extract<CatalogQuery, { kind: "products" }>;

const newestFirst = (a: ProductCandidate, b: ProductCandidate) => (b.createdAt > a.createdAt ? 1 : b.createdAt < a.createdAt ? -1 : 0);

function bySales(key: "sold90" | "sold14") {
  return (a: ProductCandidate, b: ProductCandidate) => (b[key] ?? 0) - (a[key] ?? 0) || newestFirst(a, b);
}

function sortBy(sort: ProductSort | undefined): ((a: ProductCandidate, b: ProductCandidate) => number) | null {
  switch (sort) {
    case "newest":
      return newestFirst;
    case "price-asc":
      return (a, b) => (a.price ?? Infinity) - (b.price ?? Infinity) || newestFirst(a, b);
    case "price-desc":
      return (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity) || newestFirst(a, b);
    case "rating":
      return (a, b) => (b.rating ?? 0) - (a.rating ?? 0) || newestFirst(a, b);
    default:
      return null;
  }
}

/** True when a product has a real discount. */
export function isDiscounted(product: Pick<ProductCandidate, "price" | "compareAtPrice">): boolean {
  return product.price != null && product.compareAtPrice != null && product.compareAtPrice > product.price;
}

/**
 * The products a query shows, in display order, at most `limit`.
 * `categoryOrder` is the store's category ids in display order, for a
 * `category` query by position (`categoryIndex`).
 */
export function selectProducts<T extends ProductCandidate>(query: ProductQuery, candidates: readonly T[], categoryOrder: readonly string[] = []): T[] {
  let list: T[];
  switch (query.source) {
    case "selected": {
      const byId = new Map(candidates.map((p) => [p.id, p]));
      // The seller's own order; sorting does not apply to hand-picked lists.
      return (query.productIds ?? [])
        .map((id) => byId.get(id))
        .filter((p): p is T => Boolean(p))
        .slice(0, query.limit);
    }
    case "featured":
      list = candidates.filter((p) => p.isFeatured).sort(newestFirst);
      break;
    case "category": {
      const categoryId = query.categoryId ?? (query.categoryIndex ? categoryOrder[query.categoryIndex - 1] : undefined);
      list = categoryId ? candidates.filter((p) => p.categoryId === categoryId).sort(newestFirst) : [];
      break;
    }
    case "best-sellers":
      list = candidates.filter((p) => (p.sold90 ?? 0) > 0).sort(bySales("sold90"));
      break;
    case "trending":
      list = candidates.filter((p) => (p.sold14 ?? 0) > 0).sort(bySales("sold14"));
      break;
    case "discounted":
      list = candidates.filter(isDiscounted).sort(newestFirst);
      break;
    case "related": {
      // Same category first, then the newest of the rest; never the current product.
      const rel = query.relatedTo;
      const others = candidates.filter((p) => p.id !== rel?.productId).sort(newestFirst);
      const same = rel?.categoryId ? others.filter((p) => p.categoryId === rel.categoryId) : [];
      // The source's own order is kept: a sort would break "same category first".
      return [...same, ...others.filter((p) => !same.includes(p))].slice(0, query.limit);
    }
    default:
      list = [...candidates].sort(newestFirst);
  }
  const order = sortBy(query.sort);
  if (order) list = list.sort(order);
  return list.slice(0, query.limit);
}
