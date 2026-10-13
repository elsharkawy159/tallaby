import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BASE_URL, DEFAULT_CURRENCY } from "./constants";
import { contentParams } from "./content-params";
import { routing } from "@/i18n/routing";
import { buildAlternates, buildLocalizedUrl } from "./sitemap/sitemap.lib";
import { getPublicUrl } from "@workspace/ui/lib/utils";

export type SeoLocale = (typeof routing.locales)[number];

/** Builds an absolute, locale-prefixed URL ("as-needed": default locale unprefixed). */
export function localizedUrl(locale: SeoLocale, path: string): string {
  return buildLocalizedUrl(BASE_URL, locale, path);
}

/**
 * Builds the `alternates.languages` map for a page that exists in one or
 * both locales at `path` (or per-locale paths, for entities like products
 * whose slug differs by locale). `x-default` points at the default-locale
 * (Arabic) URL when it exists, falling back to whichever locale is available.
 * Shared with the XML sitemap so its hreflang annotations match the pages.
 */
export function buildLanguageAlternates(
  urls: Partial<Record<SeoLocale, string>>
): Record<string, string> {
  return buildAlternates(urls, BASE_URL);
}

/**
 * Product images are stored as bucket paths ("2026-09-10/foo.png"). Left
 * as-is, metadataBase resolves them against the site origin (a 404), so
 * resolve them to the public Supabase storage URL instead.
 */
export function absoluteProductImageUrl(image: string): string {
  return getPublicUrl(image, "products");
}

/**
 * Social-share preview image. Link unfurlers (notably WhatsApp) silently drop
 * previews for large images, and seller uploads are often 1MB+ PNGs, so serve
 * a downscaled copy through Supabase image transformations.
 */
export function socialShareImageUrl(image: string): string {
  const url = absoluteProductImageUrl(image);
  if (!url.includes(".supabase.co/storage/v1/object/public/")) return url;
  return (
    url.replace("/storage/v1/object/public/", "/storage/v1/render/image/public/") +
    "?width=1200&height=630&resize=contain&quality=80"
  );
}

/** Parses a `?page=` search param; anything missing or invalid is page 1. */
export function parsePageParam(value: string | string[] | undefined): number {
  const page = Math.floor(Number(Array.isArray(value) ? value[0] : value));
  return Number.isFinite(page) && page > 1 ? page : 1;
}

/**
 * Pages 2+ of a listing are canonical to themselves: pointing a paginated
 * series at page 1 tells Google to drop the deeper pages (and the products
 * only linked from them).
 */
function withPage(path: string, page = 1): string {
  return page > 1 ? `${path}?page=${page}` : path;
}

/** "Phones | Buy Online…" -> "Phones - Page 2 | Buy Online…", so titles in a series differ. */
export async function paginatedTitle(
  locale: SeoLocale,
  title: string,
  page = 1
): Promise<string> {
  if (page <= 1) return title;
  const t = await getTranslations({ locale, namespace: "seo" });
  const label = t("pageLabel", { page: String(page) });
  const brandAt = title.indexOf(" | ");
  return brandAt === -1
    ? `${title} - ${label}`
    : `${title.slice(0, brandAt)} - ${label}${title.slice(brandAt)}`;
}

const OG_LOCALE: Record<SeoLocale, string> = {
  en: "en_US",
  ar: "ar_EG",
};

interface ProductMetadataProps {
  locale: SeoLocale;
  product: {
    title: string;
    /** Slug in `locale`. */
    slug: string;
    description: string;
    price: {
      final: number;
      list?: number;
    };
    images: string[];
    brand: {
      name: string;
    };
    category: {
      name: string;
      slug: string;
    };
    averageRating: number;
    reviewCount: number;
    inStock?: boolean;
    /** Seller-entered SEO overrides (dashboard "SEO" fields). */
    metaTitle?: string | null;
    metaDescription?: string | null;
  };
  /** Slug for the same product in the other locale, if translated. */
  alternateSlug?: string | null;
}

export async function generateProductMetadata({
  locale,
  product,
  alternateSlug,
}: ProductMetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const params = contentParams(locale);
  const title = t("productTitle", {
    title: product.metaTitle?.trim() || product.title,
  });
  const description =
    product.metaDescription?.trim() ||
    product.description ||
    t("productDescription", {
      ...params,
      title: product.title,
      brand: product.brand.name,
      category: product.category.name,
    });

  const price = product.price.final;
  const originalPrice = product.price.list;
  const discount =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  const firstImage = product.images?.find((image) => image?.trim());
  const shareImage = firstImage
    ? { url: socialShareImageUrl(firstImage), alt: product.title }
    : { url: "/og-image.jpg", width: 1200, height: 630, alt: product.title };
  const otherLocale: SeoLocale = locale === "en" ? "ar" : "en";
  const productUrl = localizedUrl(locale, `/products/${product.slug}`);
  const languages = buildLanguageAlternates({
    [locale]: productUrl,
    ...(alternateSlug
      ? { [otherLocale]: localizedUrl(otherLocale, `/products/${alternateSlug}`) }
      : {}),
  } as Partial<Record<SeoLocale, string>>);

  return {
    // The message already carries "| Tallaby.com"; `absolute` stops the root
    // layout's "%s | Tallaby.com" template appending the brand a second time.
    title: { absolute: title },
    description,
    keywords: [
      product.title,
      product.brand.name,
      product.category.name,
      t("keywordBuyOnline"),
      "tallaby",
      ...(discount > 0 ? [`${discount}% off`, "sale", "discount"] : []),
    ],
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      url: productUrl,
      siteName: "Tallaby.com",
      title,
      description,
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [shareImage],
      site: "@tallaby",
    },
    alternates: {
      canonical: productUrl,
      languages,
    },
  };
}

/**
 * Open Graph product:* tags (Facebook/Pinterest). Rendered by the product page
 * as <meta property=…>, since the Metadata API's `other` only emits name=.
 */
export function productOpenGraphTags(
  product: ProductMetadataProps["product"]
): Record<string, string> {
  return {
    "product:price:amount": product.price.final.toString(),
    "product:price:currency": DEFAULT_CURRENCY,
    "product:availability":
      product.inStock === false ? "out of stock" : "in stock",
    ...(product.brand.name && { "product:brand": product.brand.name }),
    "product:category": product.category.name,
    ...(product.averageRating > 0 && {
      "product:rating:value": product.averageRating.toString(),
      "product:rating:scale": "5",
      "product:rating:count": product.reviewCount.toString(),
    }),
  };
}

interface CategoryMetadataProps {
  locale: SeoLocale;
  category: {
    name: string;
    slug: string;
    description?: string;
    productCount?: number;
  };
  page?: number;
}

export async function generateCategoryMetadata({
  locale,
  category,
  page = 1,
}: CategoryMetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const params = contentParams(locale);
  const title = await paginatedTitle(
    locale,
    t("categoryTitle", { name: category.name }),
    page
  );
  const description =
    category.description ||
    t("categoryDescription", { ...params, name: category.name });

  // Categories share one slug across locales, so both language URLs exist
  // whenever the category exists at all.
  const categoryPath = withPage(`/categories/${category.slug}`, page);
  const categoryUrl = localizedUrl(locale, categoryPath);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, categoryPath)])
    ) as Partial<Record<SeoLocale, string>>
  );

  return {
    title: { absolute: title },
    description,
    keywords: [
      category.name,
      t("keywordShopOnline"),
      t("keywordBuyOnline"),
      "tallaby",
      ...(category.productCount ? [`${category.productCount} products`] : []),
    ],
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      title,
      description,
      url: categoryUrl,
      siteName: "Tallaby.com",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: t("categoryImageAlt", { name: category.name }),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
      site: "@tallaby",
    },
    alternates: {
      canonical: categoryUrl,
      languages,
    },
  };
}

interface BrandMetadataProps {
  locale: SeoLocale;
  brand: {
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    productCount?: number;
  };
  page?: number;
}

export async function generateBrandMetadata({
  locale,
  brand,
  page = 1,
}: BrandMetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const params = contentParams(locale);
  const title = await paginatedTitle(
    locale,
    t("brandTitle", { name: brand.name }),
    page
  );
  const description =
    brand.description || t("brandDescription", { ...params, name: brand.name });

  const brandPath = withPage(`/brands/${brand.slug}`, page);
  const brandUrl = localizedUrl(locale, brandPath);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, brandPath)])
    ) as Partial<Record<SeoLocale, string>>
  );
  // Logos aren't 1200x630, so only the default share image declares a size.
  const image = brand.logoUrl
    ? { url: brand.logoUrl, alt: brand.name }
    : { url: "/og-image.jpg", width: 1200, height: 630, alt: brand.name };

  return {
    title: { absolute: title },
    description,
    keywords: [
      brand.name,
      t("keywordShopOnline"),
      t("keywordBuyOnline"),
      "tallaby",
    ],
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      title,
      description,
      url: brandUrl,
      siteName: "Tallaby.com",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      site: "@tallaby",
    },
    alternates: {
      canonical: brandUrl,
      languages,
    },
  };
}

interface StaticPageMetadataProps {
  locale: SeoLocale;
  /** Path relative to the locale root, e.g. "/shipping". */
  path: string;
  title: string;
  description: string;
  /** Listing page number; 2+ gets a self-referencing `?page=N` canonical. */
  page?: number;
}

/**
 * Shared metadata builder for static informational pages (about, shipping,
 * returns, privacy, etc.) that exist identically at the same path in every
 * locale — handles canonical + hreflang + OG/Twitter consistently.
 */
export function generateStaticPageMetadata({
  locale,
  path,
  title,
  description,
  page = 1,
}: StaticPageMetadataProps): Metadata {
  const pagePath = withPage(path, page);
  const pageUrl = localizedUrl(locale, pagePath);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, pagePath)])
    ) as Partial<Record<SeoLocale, string>>
  );

  return {
    // Page titles in messages/*.json already end in "| Tallaby", so `absolute`
    // stops the root layout template appending the brand a second time.
    title: { absolute: title },
    description,
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      url: pageUrl,
      siteName: "Tallaby.com",
      title,
      description,
      images: [{ url: "/og-image.jpg", width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.jpg"],
      site: "@tallaby",
    },
    alternates: {
      canonical: pageUrl,
      languages,
    },
  };
}

interface StoreMetadataProps {
  locale: SeoLocale;
  store: {
    name: string;
    slug: string;
    description?: string | null;
    logoUrl?: string | null;
    productCount?: number | null;
  };
  page?: number;
}

export async function generateStoreMetadata({
  locale,
  store,
  page = 1,
}: StoreMetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const params = contentParams(locale);
  const title = await paginatedTitle(
    locale,
    t("storeTitle", { name: store.name }),
    page
  );
  const description =
    store.description || t("storeDescription", { ...params, name: store.name });

  const storePath = withPage(`/stores/${store.slug}`, page);
  const storeUrl = localizedUrl(locale, storePath);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, storePath)])
    ) as Partial<Record<SeoLocale, string>>
  );
  const image = store.logoUrl
    ? { url: store.logoUrl, alt: store.name }
    : { url: "/og-image.jpg", width: 1200, height: 630, alt: store.name };

  return {
    title: { absolute: title },
    description,
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      title,
      description,
      url: storeUrl,
      siteName: "Tallaby.com",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
      site: "@tallaby",
    },
    alternates: {
      canonical: storeUrl,
      languages,
    },
  };
}

export function generateNoIndexMetadata(): Metadata {
  return {
    robots: {
      index: false,
      follow: false,
    },
  };
}

export async function generateHomeMetadata(
  locale: SeoLocale
): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "metadata" });
  const params = contentParams(locale);
  const title = t("title", params);
  const description = t("description", params);
  const homeUrl = localizedUrl(locale, "");
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, "")])
    ) as Partial<Record<SeoLocale, string>>
  );

  return {
    // `absolute` opts out of the layout's "%s | Tallaby.com" template — the
    // localized home title already carries the brand.
    title: { absolute: title },
    description,
    keywords: t("keywords").split(",").map((k) => k.trim()),
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      url: homeUrl,
      siteName: t("siteName"),
      title: t("ogTitle"),
      description: t("ogDescription", params),
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@tallaby",
      title: t("twitterTitle"),
      description: t("twitterDescription", params),
      images: ["/og-image.jpg"],
    },
    alternates: {
      canonical: homeUrl,
      languages,
    },
  };
}
