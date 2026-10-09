import { getProducts } from "@/actions/products";
import type { ProductCardProps } from "@/components/product";
import { PRODUCT_IMAGE_FALLBACK, resolvePrimaryImage } from "@/lib/utils";

type ProductQuery = Omit<NonNullable<Parameters<typeof getProducts>[0]>, "locale">;

/** Product cards for a home section; an empty list (never a throw) on failure. */
export async function loadCards(
  filters: ProductQuery,
  locale: string,
): Promise<ProductCardProps[]> {
  try {
    const result = await getProducts({ ...filters, locale: locale as "en" | "ar" });
    return result?.success && result.data ? (result.data as ProductCardProps[]) : [];
  } catch {
    return [];
  }
}

/** Image of the first product matching a search term, or null when nothing matches. */
export async function loadSearchImage(search: string, locale: string): Promise<string | null> {
  const [first] = await loadCards({ searchQuery: search, sortBy: "popular", limit: 1 }, locale);
  if (!first) return null;
  const image = resolvePrimaryImage(first.images);
  return image === PRODUCT_IMAGE_FALLBACK ? null : image;
}

export const productsHref = (params: Record<string, string>) =>
  `/products?${new URLSearchParams(params).toString()}`;
