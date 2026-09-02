import type { MetadataRoute } from "next";
import { localizedUrl } from "@/lib/metadata";
import { routing } from "@/i18n/routing";
import { getAllProductTranslationSlugs } from "@/actions/products";
import { getAllCategorySlugs } from "@/actions/categories";
import { getAllBrands } from "@/actions/brands";
import { getAllSellers } from "@/actions/seller";

const STATIC_PATHS: Array<{
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
}> = [
  { path: "", changeFrequency: "daily", priority: 1 },
  { path: "/products", changeFrequency: "daily", priority: 0.9 },
  { path: "/categories", changeFrequency: "weekly", priority: 0.8 },
  { path: "/brands", changeFrequency: "weekly", priority: 0.6 },
  { path: "/stores", changeFrequency: "weekly", priority: 0.6 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.5 },
  { path: "/help", changeFrequency: "weekly", priority: 0.6 },
  { path: "/faq", changeFrequency: "weekly", priority: 0.5 },
  { path: "/shipping", changeFrequency: "monthly", priority: 0.5 },
  { path: "/returns", changeFrequency: "monthly", priority: 0.5 },
  { path: "/payment", changeFrequency: "monthly", priority: 0.4 },
  { path: "/careers", changeFrequency: "monthly", priority: 0.3 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.3 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.3 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.2 },
  { path: "/sell", changeFrequency: "weekly", priority: 0.7 },
];

/** Every locale's URL for `path`, for a sitemap entry's alternates.languages. */
function languageAlternatesFor(path: string): Record<string, string> {
  return Object.fromEntries(
    routing.locales.map((locale) => [locale, localizedUrl(locale, path)])
  );
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const currentDate = new Date();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.flatMap(
    ({ path, changeFrequency, priority }) =>
      routing.locales.map((locale) => ({
        url: localizedUrl(locale, path),
        lastModified: currentDate,
        changeFrequency,
        priority,
        alternates: { languages: languageAlternatesFor(path) },
      }))
  );

  // Categories, brands and stores share one slug across locales.
  const [categoriesResult, brandsResult, sellersResult] = await Promise.all([
    getAllCategorySlugs(),
    getAllBrands({ limit: 1000 }),
    getAllSellers({ limit: 1000 }),
  ]);

  const categoryEntries: MetadataRoute.Sitemap = (
    categoriesResult.success ? (categoriesResult.data ?? []) : []
  ).flatMap((slug) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(locale, `/categories/${slug}`),
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.8,
      alternates: { languages: languageAlternatesFor(`/categories/${slug}`) },
    }))
  );

  const brandEntries: MetadataRoute.Sitemap = (
    brandsResult.success ? (brandsResult.data ?? []) : []
  ).flatMap((brand) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(locale, `/brands/${brand.slug}`),
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.6,
      alternates: { languages: languageAlternatesFor(`/brands/${brand.slug}`) },
    }))
  );

  const storeEntries: MetadataRoute.Sitemap = (
    sellersResult.success ? (sellersResult.data ?? []) : []
  ).flatMap((seller: any) =>
    routing.locales.map((locale) => ({
      url: localizedUrl(locale, `/stores/${seller.slug}`),
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.5,
      alternates: { languages: languageAlternatesFor(`/stores/${seller.slug}`) },
    }))
  );

  // Products: slug differs per locale, so group translation rows by product
  // to cross-reference each locale's URL as the other's alternate.
  const translationsResult = await getAllProductTranslationSlugs();
  const byProduct = new Map<
    string,
    { locale: "en" | "ar"; slug: string; updatedAt: string | null }[]
  >();
  for (const row of translationsResult.success
    ? (translationsResult.data ?? [])
    : []) {
    const list = byProduct.get(row.productId) ?? [];
    list.push({ locale: row.locale, slug: row.slug, updatedAt: row.updatedAt });
    byProduct.set(row.productId, list);
  }

  const productEntries: MetadataRoute.Sitemap = Array.from(
    byProduct.values()
  ).flatMap((translations) => {
    const languages = Object.fromEntries(
      translations.map((t) => [t.locale, localizedUrl(t.locale, `/products/${t.slug}`)])
    );
    return translations.map((t) => ({
      url: localizedUrl(t.locale, `/products/${t.slug}`),
      lastModified: t.updatedAt ? new Date(t.updatedAt) : currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      alternates: { languages },
    }));
  });

  return [
    ...staticEntries,
    ...categoryEntries,
    ...brandEntries,
    ...storeEntries,
    ...productEntries,
  ];
}
