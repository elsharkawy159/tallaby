"use server";

import { getProducts } from "@/actions/products";
import type { ProductCardProps } from "@/components/product";
import type { ProductLocale } from "@/lib/product-translations";
import { catalogStoreId, getRequestStoreSubdomain, getStorefrontBySubdomain } from "@/lib/storefront.server";
import { isStoreOfflineForRequest } from "@/lib/store-site/offline.server";
import { resolvePrice, resolvePrimaryImage } from "@/lib/utils";

export type StorefrontSearchResult = {
  id: string;
  title: string;
  slug: string;
  image: string;
  price: number;
};

const LIMIT = 6;

/**
 * Live search of the header search box on a store website: this store's
 * active products only, its catalog rules applied (D24). The store comes
 * from the request host, never from the client (CLAUDE.md rule 5), so the
 * marketplace and an offline store get nothing.
 */
export async function searchStorefrontProducts(
  query: string,
  locale: string,
): Promise<{ results: StorefrontSearchResult[]; total: number }> {
  const search = typeof query === "string" ? query.trim().slice(0, 100) : "";
  if (search.length < 2) return { results: [], total: 0 };

  const subdomain = await getRequestStoreSubdomain();
  const store = subdomain ? await getStorefrontBySubdomain(subdomain) : null;
  if (!store || (await isStoreOfflineForRequest(store))) return { results: [], total: 0 };

  const result = await getProducts({
    sellerId: store.id,
    catalogStoreId: catalogStoreId(store),
    searchQuery: search,
    sortBy: "popular",
    limit: LIMIT,
    locale: (locale === "en" ? "en" : "ar") as ProductLocale,
  });
  if (!result.success) return { results: [], total: 0 };

  const results = (result.data ?? []).map((raw) => {
    const product = raw as unknown as ProductCardProps;
    return {
      id: String(product.id),
      title: String(product.title ?? ""),
      slug: String(product.slug ?? ""),
      image: resolvePrimaryImage(product.images),
      price: resolvePrice(product),
    };
  });
  return { results: results.filter((product) => product.slug), total: result.totalCount };
}
