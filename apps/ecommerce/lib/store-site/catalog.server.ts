import { parsePriceJson } from "@workspace/lib";
import type {
  BrandSummary,
  CatalogQuery,
  CategorySummary,
  CouponSummary,
  ProductSort,
  ProductSummary,
  ReviewStats,
  ReviewSummary,
} from "@workspace/store-sections/render";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { getProducts } from "@/actions/products";
import type { ProductLocale } from "@/lib/product-translations";
import { getStorefrontCategories, storeCategoryFilter, type StorefrontCategory } from "@/lib/storefront.server";
import type { StoreCategoryFilter } from "@workspace/lib/store-sites/catalog-data";
import { SALES_DAYS, getCachedSellerBrands, getCachedSellerCoupons, getCachedStoreReviewStats, getCachedStoreReviews, getCachedStoreSales } from "./store-data.server";

/**
 * Catalog for builder sections on a store host (PLAN.md P5-02). Only this
 * store's seller's active products (and only the store's picks in selected
 * catalog mode), whatever ids a stored section asks for: a picked product of
 * another seller, or one the store does not show, is simply not returned.
 */

type RawProduct = Record<string, unknown> & {
  id: string;
  title?: string;
  slug?: string;
  images?: unknown;
  price?: unknown;
  quantity?: unknown;
  averageRating?: number | null;
  productVariants?: unknown[];
  isTrending?: boolean | null;
  isSeasonal?: boolean | null;
};

export type ResolvedCatalog = {
  products: Record<string, ProductSummary[]>;
  categories: CategorySummary[];
  /** Products that need a variant choice: the card links to the product page instead of adding. */
  withVariants: Set<string>;
  brands?: BrandSummary[];
  reviews?: Record<string, ReviewSummary[]>;
  reviewStats?: ReviewStats;
  coupons?: Record<string, CouponSummary>;
  /** The page each paginated product list shows (`paginate` queries). */
  productPages?: Record<string, { page: number; totalPages: number }>;
};

function nthImage(images: unknown, index: number): string | null {
  if (!Array.isArray(images)) return null;
  const found = images.filter((image): image is string => typeof image === "string" && image.trim() !== "")[index];
  return found ? getPublicUrl(found, "products") || null : null;
}

const firstImage = (images: unknown) => nthImage(images, 0);

function toSummary(product: RawProduct): ProductSummary {
  const price = parsePriceJson(product.price);
  const final = price.final ?? null;
  const list = price.list ?? null;
  return {
    id: product.id,
    title: product.title ?? "",
    href: `/products/${product.slug ?? product.id}`,
    image: firstImage(product.images),
    secondImage: nthImage(product.images, 1),
    price: final,
    compareAtPrice: list != null && final != null && list > final ? list : null,
    rating: product.averageRating ?? null,
    inStock: Number(product.quantity ?? 0) > 0,
    trending: product.isTrending === true,
    seasonal: product.isSeasonal === true,
  };
}

/** `getProducts` rows as product-list records, and the ids that need a variant choice. */
export function toProductSummaries(rows: readonly unknown[]): { products: ProductSummary[]; withVariants: Set<string> } {
  const list = rows as RawProduct[];
  return {
    products: list.map(toSummary),
    withVariants: new Set(list.filter((row) => (row.productVariants?.length ?? 0) > 0).map((row) => row.id)),
  };
}

function categorySummary(category: StorefrontCategory, locale: string): CategorySummary {
  const name = (locale === "ar" ? category.nameAr || category.name : category.name || category.nameAr) ?? category.key;
  return {
    id: category.key,
    key: category.key,
    name,
    // Builder sites list a category on the catalog page (/products).
    href: `/products?category=${encodeURIComponent(category.key)}`,
    image: category.coverImage,
    productCount: category.productCount,
  };
}

const SORT_BY: Record<Exclude<ProductSort, "default">, "newest" | "price_asc" | "price_desc" | "rating"> = {
  newest: "newest",
  "price-asc": "price_asc",
  "price-desc": "price_desc",
  rating: "rating",
};

/** Same order as `selectProducts` (core/catalog-resolve.ts) for lists ranked by sales. */
function sortSummaries(list: ProductSummary[], sort: ProductSort | undefined): ProductSummary[] {
  if (!sort || sort === "default" || sort === "newest") return list;
  const copy = [...list];
  if (sort === "price-asc") copy.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  if (sort === "price-desc") copy.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
  if (sort === "rating") copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return copy;
}

/**
 * `storeId` is the host's store (its orders rank best sellers); `catalogStoreId`
 * is set for a store in selected catalog mode (D24): only its picks are returned.
 */
export async function resolveStoreCatalog(
  sellerId: string,
  storeId: string,
  catalogStoreId: string | undefined,
  queries: Record<string, CatalogQuery>,
  locale: string,
): Promise<ResolvedCatalog> {
  const entries = Object.entries(queries);
  const withVariants = new Set<string>();
  const needsCategories = entries.some(([, q]) => q.kind === "categories" || (q.kind === "products" && q.source === "category"));
  const storeCategories = needsCategories ? await getStorefrontCategories(sellerId, catalogStoreId) : [];

  const products: Record<string, ProductSummary[]> = {};
  const productPages: Record<string, { page: number; totalPages: number }> = {};
  const fetchPage = async (filters: Partial<Parameters<typeof getProducts>[0]>, limit: number) => {
    const result = await getProducts({
      sellerId,
      catalogStoreId,
      locale: locale as ProductLocale,
      limit: Math.min(limit, 48),
      sortBy: "newest",
      ...filters,
    });
    const rows = (result.success ? (result.data ?? []) : []) as unknown as RawProduct[];
    for (const row of rows) if ((row.productVariants?.length ?? 0) > 0) withVariants.add(row.id);
    return { summaries: rows.map(toSummary), total: result.success ? Number(result.totalCount ?? 0) : 0 };
  };
  await Promise.all(
    entries.map(async ([instanceId, query]) => {
      if (query.kind !== "products") return;
      const sortBy = query.sort && query.sort !== "default" ? SORT_BY[query.sort] : undefined;
      // A paginated list (the home page's main grid): page `query.page` of `query.limit` products.
      const page = query.paginate ? Math.max(1, Math.floor(query.page ?? 1)) : 1;
      const offset = (page - 1) * query.limit;
      const setPages = (total: number) => {
        if (query.paginate) productPages[instanceId] = { page, totalPages: Math.max(1, Math.ceil(total / query.limit)) };
      };
      // Ranked by units sold in this store's orders: never a product without sales.
      if (query.source === "best-sellers" || query.source === "trending") {
        const sales = await getCachedStoreSales(sellerId, storeId, SALES_DAYS[query.source]);
        const ranked = sales.filter(([, units]) => units > 0).sort((a, b) => b[1] - a[1]);
        const ids = (query.paginate ? ranked.slice(0, 96).slice(offset, offset + query.limit) : ranked.slice(0, Math.min(query.limit * 2, 96))).map(([id]) => id);
        setPages(Math.min(ranked.length, 96));
        if (!ids.length) {
          products[instanceId] = [];
          return;
        }
        const rank = new Map(ids.map((id, index) => [id, index]));
        const list = (await fetchPage({ productIds: ids }, ids.length)).summaries.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
        products[instanceId] = sortSummaries(list.slice(0, query.limit), query.sort);
        return;
      }
      if (query.source === "discounted") {
        const result = await fetchPage({ onSale: true, ...(sortBy && { sortBy }), ...(offset > 0 && { offset }) }, query.limit);
        setPages(result.total);
        products[instanceId] = result.summaries;
        return;
      }
      // Same category first, then the newest; never the current product. Fetches one extra row to drop it.
      if (query.source === "related" && query.relatedTo) {
        const { productId, categoryId } = query.relatedTo;
        const same = categoryId ? (await fetchPage({ categoryIds: [categoryId] }, query.limit + 1)).summaries.filter((p) => p.id !== productId) : [];
        const picked = same.slice(0, query.limit);
        if (picked.length < query.limit) {
          const have = new Set([productId, ...picked.map((p) => p.id)]);
          const fill = (await fetchPage({}, query.limit + picked.length + 1)).summaries.filter((p) => !have.has(p.id));
          picked.push(...fill.slice(0, query.limit - picked.length));
        }
        products[instanceId] = picked;
        return;
      }
      let storeCategory: StoreCategoryFilter | undefined;
      if (query.source === "category") {
        // By id, or by position: the store's Nth category in the order its category lists show (a template row).
        // An id saved before seller categories is a Tallaby one: the store category holding it.
        const category = query.categoryId
          ? (storeCategories.find((c) => c.key === query.categoryId) ??
            storeCategories.find((c) => c.sourceCategoryId === query.categoryId || c.categoryIds.includes(query.categoryId ?? "")))
          : query.categoryIndex
            ? storeCategories[query.categoryIndex - 1]
            : undefined;
        if (!category) {
          products[instanceId] = [];
          return;
        }
        storeCategory = storeCategoryFilter(category);
      }
      const result = await fetchPage(
        {
          ...(offset > 0 && { offset }),
          ...(query.source === "featured" && { isFeatured: true }),
          ...(storeCategory && { storeCategory }),
          ...(query.source === "selected" && { productIds: query.productIds ?? [] }),
          // Hand-picked lists keep the seller's order.
          ...(sortBy && query.source !== "selected" && { sortBy }),
        },
        query.limit,
      );
      setPages(result.total);
      let summaries = result.summaries;
      if (query.source === "selected" && query.productIds) {
        const order = new Map(query.productIds.map((id, index) => [id, index]));
        summaries = summaries.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      }
      products[instanceId] = summaries;
    }),
  );

  const extra = await resolveStoreExtras(sellerId, catalogStoreId, entries, locale);
  const categoryLimit = Math.max(0, ...entries.map(([, q]) => (q.kind === "categories" ? q.limit : 0)));
  return {
    products,
    categories: storeCategories.slice(0, Math.max(categoryLimit, 0) || storeCategories.length).map((c) => categorySummary(c, locale)),
    withVariants,
    productPages,
    ...extra,
  };
}

/**
 * Brands, reviews and coupons the page asks for. A source that fails is
 * left out (its sections stay hidden on the storefront) and logged, so one
 * broken source never breaks the page.
 */
async function resolveStoreExtras(
  sellerId: string,
  catalogStoreId: string | undefined,
  entries: [string, CatalogQuery][],
  locale: string,
): Promise<Pick<ResolvedCatalog, "brands" | "reviews" | "reviewStats" | "coupons">> {
  const safe = async <T,>(label: string, load: () => Promise<T>): Promise<T | null> => {
    try {
      return await load();
    } catch (error) {
      console.error(`[store-site] ${label} failed`, error instanceof Error ? error.message : error);
      return null;
    }
  };
  const brandLimit = Math.max(0, ...entries.map(([, q]) => (q.kind === "brands" ? q.limit : 0)));
  const reviewQueries = entries.filter((e): e is [string, Extract<CatalogQuery, { kind: "reviews" }>] => e[1].kind === "reviews");
  const couponIds = [...new Set(entries.flatMap(([, q]) => (q.kind === "coupon" ? [q.couponId] : [])))].sort();
  const scope = catalogStoreId ?? "";
  const [brandRows, reviewLists, reviewStats, couponRows] = await Promise.all([
    brandLimit ? safe("brands", () => getCachedSellerBrands(sellerId)) : null,
    Promise.all(
      reviewQueries.map(async ([instanceId, q]) => [instanceId, await safe("reviews", () => getCachedStoreReviews(sellerId, scope, q.limit, q.minRating ?? 0))] as const),
    ),
    reviewQueries.length ? safe("review stats", () => getCachedStoreReviewStats(sellerId, scope)) : null,
    couponIds.length ? safe("coupons", () => getCachedSellerCoupons(sellerId, couponIds.join(","))) : null,
  ]);

  const title = (value: { ar: string | null; en: string | null }) => (locale === "ar" ? value.ar || value.en : value.en || value.ar) ?? null;
  const reviews: Record<string, ReviewSummary[]> = {};
  for (const [instanceId, rows] of reviewLists) {
    if (!rows) continue;
    reviews[instanceId] = rows.map((r) => ({
      id: r.id,
      rating: r.rating,
      title: r.title,
      body: r.body,
      authorName: r.authorName,
      verified: r.verified,
      productTitle: title(r.productTitle),
      productHref: `/products/${r.productSlug ?? r.productId}`,
      createdAt: r.createdAt,
    }));
  }
  const now = Date.now();
  const coupons: Record<string, CouponSummary> = {};
  for (const c of couponRows ?? []) {
    // Live is decided now, not when the rows were cached.
    if (!c.live || Date.parse(c.endsAt) <= now) continue;
    coupons[c.id] = { id: c.id, code: c.code, name: c.name, discountType: c.discountType, discountValue: c.discountValue, endsAt: c.endsAt };
  }
  return {
    ...(brandRows && {
      brands: brandRows.slice(0, brandLimit).map((b) => ({
        id: b.id,
        name: (locale === "ar" ? b.nameAr || b.name : b.name || b.nameAr) ?? "",
        logo: b.logoUrl ? getPublicUrl(b.logoUrl, "sellers") || null : null,
        href: null,
      })),
    }),
    reviews,
    ...(reviewStats && { reviewStats }),
    coupons,
  };
}
