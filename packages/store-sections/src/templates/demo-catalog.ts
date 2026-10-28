/**
 * A template's demo store as a render catalog, for previews outside the
 * editor (the tallaby.com template gallery). Products follow the same
 * `selectProducts` rule as the storefront; reviews and coupons stay empty.
 * No React here.
 */
import { selectProducts } from "../core/catalog-resolve";
import type { SiteLocale } from "../config/schema";
import type { CatalogQuery, ProductSummary, RenderContext } from "../core/types";
import type { TemplateDemo } from "./types";

export function resolveDemoCatalog(
  queries: Record<string, CatalogQuery>,
  demo: TemplateDemo | null | undefined,
  locale: SiteLocale,
): RenderContext["catalog"] {
  const name = (value: { ar: string; en: string }) => value[locale] || value.ar || value.en;
  const products: Record<string, ProductSummary[]> = {};
  for (const [instanceId, query] of Object.entries(queries)) {
    if (query.kind !== "products") continue;
    products[instanceId] = selectProducts(
      query,
      demo?.products ?? [],
      (demo?.categories ?? []).map((c) => c.id),
    ).map((p) => ({
      id: p.id,
      title: name(p.title),
      href: `/products/${p.slug}`,
      image: p.image,
      price: p.price,
      compareAtPrice: p.compareAtPrice,
      rating: p.rating ?? null,
      inStock: p.inStock,
    }));
  }
  return {
    products,
    categories: (demo?.categories ?? []).map((c) => ({
      id: c.id,
      key: c.id,
      name: name(c.name),
      href: "#",
      image: c.image,
      productCount: c.productCount,
    })),
    reviews: {},
    coupons: {},
  };
}
