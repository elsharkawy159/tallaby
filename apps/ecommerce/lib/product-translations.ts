import { and, db, eq } from "@workspace/db";
import { productTranslations } from "@workspace/db/schema";
import { isRichTextEmpty, hasRichTextMedia, mergeRichTextMediaFallback } from "@workspace/tiptap";

export type ProductLocale = "en" | "ar";

/** Translation row shape when coming from productTranslations relation array */
export interface ProductTranslationFromRelation {
  locale: string
  title: string
  description?: string | null
  content?: string | null
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
  content: string | null;
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

/**
 * Resolves which locale a product slug belongs to (for ISR-safe product pages).
 * Falls back to "ar" when the slug is not found in translations.
 */
export async function getProductLocaleFromSlug(
  slug: string
): Promise<ProductLocale> {
  const [match] = await db
    .select({ locale: productTranslations.locale })
    .from(productTranslations)
    .where(eq(productTranslations.slug, slug))
    .limit(1);

  if (match?.locale === "en" || match?.locale === "ar") {
    return match.locale;
  }

  return "ar";
}

/**
 * Returns the slug for an exact-locale translation row, or null when the
 * product has no translation in that locale — unlike
 * getProductTranslationWithFallback, this never falls back across locales.
 * Used to build hreflang alternates and to resolve the language switcher's
 * target URL, where only a *real* translation should produce a link.
 */
export async function getProductSlugForLocaleStrict(
  productId: string,
  locale: ProductLocale
): Promise<string | null> {
  const [row] = await db
    .select({ slug: productTranslations.slug })
    .from(productTranslations)
    .where(
      and(
        eq(productTranslations.productId, productId),
        eq(productTranslations.locale, locale)
      )
    )
    .limit(1);

  return row?.slug ?? null;
}

const TRANSLATION_COLUMNS = {
  title: productTranslations.title,
  description: productTranslations.description,
  content: productTranslations.content,
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

  if (!ar) {
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

  const arRow = ar as ProductTranslationRow;

  const needsEnglishContent =
    isRichTextEmpty(arRow.content) || !hasRichTextMedia(arRow.content);

  // The ar row can exist (created as soon as any AR field is filled) while
  // still missing content or media — fall back to EN per-field rather than
  // losing the whole translation.
  if (needsEnglishContent) {
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

    if (en?.content && !isRichTextEmpty(en.content)) {
      if (isRichTextEmpty(arRow.content)) {
        return { ...arRow, content: en.content };
      }

      const mergedContent = mergeRichTextMediaFallback(
        arRow.content,
        en.content
      );

      if (mergedContent && mergedContent !== arRow.content) {
        return { ...arRow, content: mergedContent };
      }
    }
  }

  return arRow;
}

export type MergedProduct<T> = T & {
  title: string;
  description: string | null;
  content: string | null;
  bulletPoints: unknown;
  slug: string;
  seo?: { metaTitle?: string; metaDescription?: string };
};

function resolveLocalizedSlug(
  product: Record<string, unknown>,
  translation: ProductTranslationRow | ProductTranslationFromRelation | null
): string {
  if (translation?.slug) return translation.slug;

  const translations = product.productTranslations as
    | ProductTranslationFromRelation[]
    | undefined;

  if (translations?.length) {
    const englishSlug = translations.find((row) => row.locale === "en")?.slug;
    if (englishSlug) return englishSlug;

    const fallbackSlug = translations.find((row) => row.slug)?.slug;
    if (fallbackSlug) return fallbackSlug;
  }

  return (product.slug as string | undefined) ?? "";
}

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
      content: ((product.content as string | null | undefined) ??
        null) as string | null,
      bulletPoints: product.bulletPoints ?? null,
      slug: resolveLocalizedSlug(product, null),
      seo,
    } as MergedProduct<T>;
  }
  return {
    ...product,
    title: translation.title,
    description: translation.description,
    content: translation.content ?? null,
    bulletPoints: translation.bulletPoints,
    slug: resolveLocalizedSlug(product, translation),
    seo: {
      metaTitle: translation.metaTitle ?? undefined,
      metaDescription: translation.metaDescription ?? undefined,
      ...(typeof product.seo === "object" && product.seo !== null
        ? (product.seo as Record<string, unknown>)
        : {}),
    },
  } as MergedProduct<T>;
}
