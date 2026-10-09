import { getTopCategories } from "@/actions/categories";
import { getPublicUrl } from "@workspace/ui/lib/utils";

export interface TopCategoryLink {
  id: string;
  /** Canonical English name — what `/products?categories=` filters on. */
  name: string;
  displayName: string;
  href: string;
  image: string | null;
  productCount: number;
}

/** Top categories (by product count) shaped for nav links and home sections. */
export async function loadTopCategories(locale: string): Promise<TopCategoryLink[]> {
  const result = await getTopCategories();
  if (!result.success || !result.data) return [];

  return result.data
    .filter((c) => c.name && c.slug)
    .map((c) => ({
      id: c.id,
      name: c.name!,
      displayName: locale === "ar" ? c.nameAr || c.name! : c.name!,
      href: `/products?${new URLSearchParams({ categories: c.name! }).toString()}`,
      image: c.imageUrl
        ? getPublicUrl(c.imageUrl, "categories")
        : c.fallbackImageUrl
          ? getPublicUrl(c.fallbackImageUrl, "products")
          : null,
      productCount: Number(c.productCount),
    }));
}
