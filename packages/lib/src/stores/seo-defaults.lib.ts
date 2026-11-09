/**
 * Default SEO values of a store and its pages (Website › SEO, 2026-11-09).
 * One rule set for the dashboard (placeholders, "Use suggestion", the search
 * preview and the checklist) and the storefront (what renders when the seller
 * left a field empty), so both always agree. Pure: no database, no React.
 */
import { SEO_KEYWORDS_MAX, SEO_KEYWORD_MAX_LENGTH, normalizeSeoKeywords } from "@workspace/store-sections/seo-keywords";

/** Where the page title goes in a store title template: "%s | My store". */
export const TITLE_TEMPLATE_TOKEN = "%s";

/** Recommended lengths (characters): Google shows about this much. */
export const SEO_TITLE_RANGE = { min: 30, max: 60 } as const;
export const SEO_DESCRIPTION_RANGE = { min: 70, max: 160 } as const;
/** A keyword list this long or longer is "enough". */
export const SEO_KEYWORDS_GOOD = 3;

export type SeoLengthStatus = "empty" | "short" | "good" | "long";

/** How a title or description length compares with its recommended range. */
export function seoLengthStatus(text: string | null | undefined, range: { min: number; max: number }): SeoLengthStatus {
  const length = (text ?? "").trim().length;
  if (length === 0) return "empty";
  if (length < range.min) return "short";
  if (length > range.max) return "long";
  return "good";
}

type SeoLocale = "ar" | "en" | string;

/** The store's category label in a language, the other language as the fallback. */
export function storeCategoryFor(
  locale: SeoLocale,
  storeCategory: string | null | undefined,
  storeCategoryAr: string | null | undefined,
): string | null {
  const label = locale === "ar" ? storeCategoryAr || storeCategory : storeCategory || storeCategoryAr;
  return label?.trim() || null;
}

/**
 * The store's title and description when the seller wrote none (ROADMAP.md
 * F-48a). Built at render time, so existing stores get it too. `category` is
 * the store's category label in the visitor's language, when it has one.
 */
export function storeSeoFallback(name: string, category: string | null | undefined, locale: SeoLocale): { title: string; description: string } {
  const label = category?.trim() || null;
  if (locale === "ar") {
    return {
      title: label ? `اشتري ${label} من ${name} الآن | طلبي` : `تسوّق من ${name} الآن | طلبي`,
      description: label
        ? `تصفح ${label} من ${name} واطلب أونلاين بخطوات بسيطة.`
        : `تصفح منتجات ${name} واطلب أونلاين بخطوات بسيطة.`,
    };
  }
  return {
    title: label ? `Buy ${label} from ${name} now | Tallaby` : `Shop from ${name} now | Tallaby`,
    description: label
      ? `Browse ${label} from ${name} and order online in a few simple steps.`
      : `Browse ${name}'s products and order online in a few simple steps.`,
  };
}

/** A usable title template ("…%s…" exactly once), else the default "%s | Store". */
export function effectiveTitleTemplate(template: string | null | undefined, storeName: string): string {
  if (template && template.split(TITLE_TEMPLATE_TOKEN).length === 2) return template;
  return `${TITLE_TEMPLATE_TOKEN} | ${storeName}`;
}

export function applyTitleTemplate(template: string, pageTitle: string): string {
  return template.replace(TITLE_TEMPLATE_TOKEN, pageTitle);
}

export type StoreSeoSource = {
  name: string;
  description?: string | null;
  storeCategory?: string | null;
  storeCategoryAr?: string | null;
};

/**
 * What the storefront shows for the store when an SEO field is empty, in one
 * language: the home page title, the title template of the other pages, the
 * description and the keywords.
 */
export function storeSeoDefaults(
  store: StoreSeoSource,
  seo: { titleTemplate?: string | null; description?: string | null; keywords?: readonly string[] | null },
  locale: SeoLocale,
): { homeTitle: string; titleTemplate: string; description: string; keywords: string[] } {
  const fallback = storeSeoFallback(store.name, storeCategoryFor(locale, store.storeCategory, store.storeCategoryAr), locale);
  return {
    // A seller who wrote a title template keeps the plain store name on the home page.
    homeTitle: seo.titleTemplate ? store.name : fallback.title,
    titleTemplate: effectiveTitleTemplate(seo.titleTemplate, store.name),
    description: seo.description?.trim() || store.description?.trim() || fallback.description,
    keywords: seo.keywords?.length ? [...seo.keywords] : storeDefaultKeywords(store),
  };
}

/** The keywords a store with none of its own renders: its name and its category, in both languages. */
export function storeDefaultKeywords(store: StoreSeoSource): string[] {
  return normalizeSeoKeywords([store.name, store.storeCategoryAr, store.storeCategory]).slice(0, SEO_KEYWORDS_MAX);
}

/**
 * Keywords to offer the seller ("Use suggestion"): the store name, its
 * category, the categories its products are in (both languages) and a few
 * shopping phrases. Computed, never AI; capped at SEO_KEYWORDS_MAX.
 */
export function suggestStoreKeywords(
  store: StoreSeoSource,
  categories: readonly { name?: string | null; nameAr?: string | null }[] = [],
): string[] {
  const label = store.storeCategoryAr || store.storeCategory;
  const labelEn = store.storeCategory || null;
  return normalizeSeoKeywords([
    store.name,
    store.storeCategoryAr,
    store.storeCategory,
    ...categories.flatMap((c) => [c.nameAr, c.name]),
    label ? `${label} أونلاين` : `متجر ${store.name}`,
    labelEn ? `${labelEn} online` : null,
    `${store.name} أونلاين`,
  ]).filter((k) => k.length <= SEO_KEYWORD_MAX_LENGTH).slice(0, SEO_KEYWORDS_MAX);
}

/** Keywords to offer for one page: its name (both languages), the store name, then the store's keywords. */
export function suggestPageKeywords(
  page: { name: { ar?: string; en?: string } },
  storeName: string,
  storeKeywords: readonly string[],
): string[] {
  return normalizeSeoKeywords([page.name.ar, page.name.en, storeName, ...storeKeywords])
    .filter((k) => k.length <= SEO_KEYWORD_MAX_LENGTH)
    .slice(0, SEO_KEYWORDS_MAX);
}

/**
 * The title a page shows in search results, as the storefront renders it.
 * Home: its own title (the store name is not added twice) or the store's home
 * default. Other pages: their own title, else their name, inside the template.
 */
export function pageSearchTitle(input: {
  isHome: boolean;
  /** The page's own SEO title ("" = none). */
  title: string | null | undefined;
  pageName: string;
  storeName: string;
  template: string;
  homeDefault: string;
}): string {
  const own = input.title?.trim();
  if (input.isHome) {
    if (!own) return input.homeDefault;
    return own.includes(input.storeName) ? own : applyTitleTemplate(input.template, own);
  }
  return applyTitleTemplate(input.template, own || input.pageName);
}

export type SeoCheckKey = "title" | "description" | "keywords" | "image" | "indexing";
export type SeoCheck = { key: SeoCheckKey; ok: boolean };

/**
 * The checklist under the store's or a page's SEO: each point is done or not.
 * `title` and `description` are the texts that will render (own or default);
 * `ownTitle`/`ownDescription` tell whether the seller wrote them.
 */
export function seoChecklist(input: {
  title: string;
  description: string;
  ownTitle: boolean;
  ownDescription: boolean;
  keywords: readonly string[];
  hasImage: boolean;
  indexing: boolean;
}): SeoCheck[] {
  return [
    { key: "title", ok: input.ownTitle && seoLengthStatus(input.title, SEO_TITLE_RANGE) === "good" },
    { key: "description", ok: input.ownDescription && seoLengthStatus(input.description, SEO_DESCRIPTION_RANGE) === "good" },
    { key: "keywords", ok: input.keywords.length >= SEO_KEYWORDS_GOOD },
    { key: "image", ok: input.hasImage },
    { key: "indexing", ok: input.indexing },
  ];
}

/** 0–100 from a checklist. */
export function seoScore(checks: readonly SeoCheck[]): number {
  if (!checks.length) return 0;
  return Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
}
