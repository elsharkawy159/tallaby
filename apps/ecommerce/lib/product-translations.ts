import { and, db, eq } from "@workspace/db";
import { productTranslations } from "@workspace/db/schema";

export type ProductLocale = "en" | "ar";

/** Translation row shape when coming from productTranslations relation array */
export interface ProductTranslationFromRelation {
  locale: string
  title: string
  description?: string | null
  bulletPoints?: unknown
  slug?: string | null
  metaTitle?: string | null
  metaDescription?: string | null
}

/**
 * Picks the best translation from a productTranslations array by locale.
 * For ar: returns AR if exists, else EN (fallback).
 * For en: returns EN.
 */
export function pickTranslationFromArray<T extends ProductTranslationFromRelation>(
  translations: T[] | undefined,
  locale: ProductLocale
): T | null {
  if (!translations?.length) return null
  if (locale === "en") {
    return translations.find((t) => t.locale === "en") ?? null
  }
  return translations.find((t) => t.locale === "ar") ?? translations.find((t) => t.locale === "en") ?? null
}

export interface ProductTranslationRow {
  title: string;
  description: string | null;
  bulletPoints: unknown;
  slug: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  locale: string;
}

/**
 * Finds product id by slug from product_translations.
 * Searches in the requested locale first, then falls back to the other locale.
 * For ar: tries AR slug first, then EN. For en: tries EN first, then AR.
 */
export async function getProductIdBySlug(
  slug: string,
  locale: ProductLocale = "en"
): Promise<string | null> {
  const firstLocale = locale
  const fallbackLocale = locale === "ar" ? "en" : "ar"

  const [first] = await db
    .select({ productId: productTranslations.productId })
    .from(productTranslations)
    .where(
      and(
        eq(productTranslations.slug, slug),
        eq(productTranslations.locale, firstLocale)
      )
    )
    .limit(1)

  if (first) return first.productId

  const [fallback] = await db
    .select({ productId: productTranslations.productId })
    .from(productTranslations)
    .where(
      and(
        eq(productTranslations.slug, slug),
        eq(productTranslations.locale, fallbackLocale)
      )
    )
    .limit(1)

  return fallback?.productId ?? null
}

const TRANSLATION_COLUMNS = {
  title: productTranslations.title,
  description: productTranslations.description,
  bulletPoints: productTranslations.bulletPoints,
  slug: productTranslations.slug,
  metaTitle: productTranslations.metaTitle,
  metaDescription: productTranslations.metaDescription,
  locale: productTranslations.locale,
} as const;

/**
 * Fetches the best translation for a product by locale.
 * For locale='ar': returns AR if exists, else EN (fallback).
 * For locale='en': returns EN.
 */
export async function getProductTranslationWithFallback(
  productId: string,
  locale: ProductLocale
): Promise<ProductTranslationRow | null> {
  if (locale === "en") {
    const [row] = await db
      .select(TRANSLATION_COLUMNS)
      .from(productTranslations)
      .where(
        and(
          eq(productTranslations.productId, productId),
          eq(productTranslations.locale, "en")
        )
      )
      .limit(1);
    return row as ProductTranslationRow | null;
  }

  // locale === 'ar': try ar first, fallback to en
  const [ar] = await db
    .select(TRANSLATION_COLUMNS)
    .from(productTranslations)
    .where(
      and(
        eq(productTranslations.productId, productId),
        eq(productTranslations.locale, "ar")
      )
    )
    .limit(1);

  if (ar) return ar as ProductTranslationRow;

  const [en] = await db
    .select(TRANSLATION_COLUMNS)
    .from(productTranslations)
    .where(
      and(
        eq(productTranslations.productId, productId),
        eq(productTranslations.locale, "en")
      )
    )
    .limit(1);

  return en as ProductTranslationRow | null;
}

export type MergedProduct<T> = T & {
  title: string;
  description: string | null;
  bulletPoints: unknown;
  slug: string;
  seo?: { metaTitle?: string; metaDescription?: string };
};

/**
 * Merges product row with localized translation fields.
 * Use products table for shared fields; translation for localized.
 */
export function mergeProductWithTranslation<T extends Record<string, unknown>>(
  product: T,
  translation: ProductTranslationRow | ProductTranslationFromRelation | null
): MergedProduct<T> {
  if (!translation) {
    const base = { ...product };
    const productSeo = product.seo;
    const seo =
      typeof productSeo === "object" &&
      productSeo !== null &&
      "metaTitle" in productSeo
        ? {
            metaTitle: (productSeo as { metaTitle?: string }).metaTitle,
            metaDescription: (productSeo as { metaDescription?: string })
              .metaDescription,
          }
        : undefined;
    return {
      ...base,
      title: ((product.title as string | undefined) ?? "") as string,
      description: ((product.description as string | null | undefined) ??
        null) as string | null,
      bulletPoints: product.bulletPoints ?? null,
      slug: ((product.slug as string | undefined) ?? "") as string,
      seo,
    } as MergedProduct<T>;
  }
  return {
    ...product,
    title: translation.title,
    description: translation.description,
    bulletPoints: translation.bulletPoints,
    slug: translation.slug ?? (product.slug as string | undefined) ?? "",
    seo: {
      metaTitle: translation.metaTitle ?? undefined,
      metaDescription: translation.metaDescription ?? undefined,
      ...(typeof product.seo === "object" && product.seo !== null
        ? (product.seo as Record<string, unknown>)
        : {}),
    },
  } as MergedProduct<T>;
}
