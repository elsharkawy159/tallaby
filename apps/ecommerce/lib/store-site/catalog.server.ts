import { parsePriceJson } from "@workspace/lib";
import type { CatalogQuery, CategorySummary, ProductSummary } from "@workspace/store-sections/render";
import { getPublicUrl } from "@workspace/ui/lib/utils";
import { getProducts } from "@/actions/products";
import type { ProductLocale } from "@/lib/product-translations";
import { getStorefrontCategories, type StorefrontCategory } from "@/lib/storefront.server";

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
};

export type ResolvedCatalog = {
  products: Record<string, ProductSummary[]>;
  categories: CategorySummary[];
  /** Products that need a variant choice: the card links to the product page instead of adding. */
  withVariants: Set<string>;
};

function firstImage(images: unknown): string | null {
  if (!Array.isArray(images)) return null;
  const first = images.find((image) => typeof image === "string" && image.trim());
  return typeof first === "string" ? getPublicUrl(first, "products") || null : null;
}

function toSummary(product: RawProduct): ProductSummary {
  const price = parsePriceJson(product.price);
  const final = price.final ?? null;
  const list = price.list ?? null;
  return {
    id: product.id,
    title: product.title ?? "",
    href: `/products/${product.slug ?? product.id}`,
    image: firstImage(product.images),
    price: final,
    compareAtPrice: list != null && final != null && list > final ? list : null,
    rating: product.averageRating ?? null,
    inStock: Number(product.quantity ?? 0) > 0,
  };
}

function categorySummary(category: StorefrontCategory, locale: string): CategorySummary {
  const name = (locale === "ar" ? category.nameAr || category.name : category.name || category.nameAr) ?? category.key;
  return {
    id: category.key,
    key: category.key,
    name,
    href: `/?category=${encodeURIComponent(category.key)}#products`,
    image: category.coverImage ? getPublicUrl(category.coverImage, "products") || null : null,
    productCount: category.productCount,
  };
}

/** `catalogStoreId` is set for a store in selected catalog mode (D24): only its picks are returned. */
export async function resolveStoreCatalog(
  sellerId: string,
  catalogStoreId: string | undefined,
  queries: Record<string, CatalogQuery>,
  locale: string,
): Promise<ResolvedCatalog> {
  const entries = Object.entries(queries);
  const withVariants = new Set<string>();
  const needsCategories = entries.some(([, q]) => q.kind === "categories" || (q.kind === "products" && q.source === "category"));
  const storeCategories = needsCategories ? await getStorefrontCategories(sellerId, catalogStoreId) : [];

  const products: Record<string, ProductSummary[]> = {};
  await Promise.all(
    entries.map(async ([instanceId, query]) => {
      if (query.kind !== "products") return;
      let categoryIds: string[] | undefined;
      if (query.source === "category") {
        const category = storeCategories.find((c) => c.key === query.categoryId || c.categoryIds.includes(query.categoryId ?? ""));
        if (!category) {
          products[instanceId] = [];
          return;
        }
        categoryIds = category.categoryIds;
      }
      const result = await getProducts({
        sellerId,
        catalogStoreId,
        locale: locale as ProductLocale,
        limit: Math.min(query.limit, 48),
        sortBy: "newest",
        ...(query.source === "featured" && { isFeatured: true }),
        ...(categoryIds && { categoryIds }),
        ...(query.source === "selected" && { productIds: query.productIds ?? [] }),
      });
      const rows = (result.success ? (result.data ?? []) : []) as unknown as RawProduct[];
      for (const row of rows) if ((row.productVariants?.length ?? 0) > 0) withVariants.add(row.id);
      let summaries = rows.map(toSummary);
      if (query.source === "selected" && query.productIds) {
        const order = new Map(query.productIds.map((id, index) => [id, index]));
        summaries = summaries.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
      }
      products[instanceId] = summaries;
    }),
  );

  const categoryLimit = Math.max(0, ...entries.map(([, q]) => (q.kind === "categories" ? q.limit : 0)));
  return {
    products,
    categories: storeCategories.slice(0, Math.max(categoryLimit, 0) || storeCategories.length).map((c) => categorySummary(c, locale)),
    withVariants,
  };
}
