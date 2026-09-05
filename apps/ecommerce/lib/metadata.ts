import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BASE_URL, DEFAULT_CURRENCY } from "./constants";
import { contentParams } from "./content-params";
import { routing } from "@/i18n/routing";

export type SeoLocale = (typeof routing.locales)[number];

/** Builds an absolute, locale-prefixed URL ("as-needed": default locale unprefixed). */
export function localizedUrl(locale: SeoLocale, path: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${BASE_URL}${prefix}${path}`;
}

/**
 * Builds the `alternates.languages` map for a page that exists in one or
 * both locales at `path` (or per-locale paths, for entities like products
 * whose slug differs by locale). `x-default` always points at the English
 * URL when it exists, falling back to whichever locale is available.
 */
export function buildLanguageAlternates(
  urls: Partial<Record<SeoLocale, string>>
): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) {
    const url = urls[locale];
    if (url) languages[locale] = url;
  }
  languages["x-default"] = urls[routing.defaultLocale] ?? Object.values(languages)[0] ?? BASE_URL;
  return languages;
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
  const title = t("productTitle", { title: product.title });
  const description =
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

  const imageUrl = product.images?.[0] || "/og-image.jpg";
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
      images: [imageUrl],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      site: "@tallaby",
    },
    alternates: {
      canonical: productUrl,
      languages,
    },
    other: {
      "product:price:amount": price.toString(),
      "product:price:currency": DEFAULT_CURRENCY,
      "product:availability": "in stock",
      "product:brand": product.brand.name,
      "product:category": product.category.name,
      ...(product.averageRating > 0 && {
        "product:rating:value": product.averageRating.toString(),
        "product:rating:scale": "5",
        "product:rating:count": product.reviewCount.toString(),
      }),
    },
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
}

export async function generateCategoryMetadata({
  locale,
  category,
}: CategoryMetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const params = contentParams(locale);
  const title = t("categoryTitle", { name: category.name });
  const description =
    category.description ||
    t("categoryDescription", { ...params, name: category.name });

  // Categories share one slug across locales, so both language URLs exist
  // whenever the category exists at all.
  const categoryUrl = localizedUrl(locale, `/categories/${category.slug}`);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, `/categories/${category.slug}`)])
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
}

export async function generateBrandMetadata({
  locale,
  brand,
}: BrandMetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const params = contentParams(locale);
  const title = t("brandTitle", { name: brand.name });
  const description =
    brand.description || t("brandDescription", { ...params, name: brand.name });

  const brandUrl = localizedUrl(locale, `/brands/${brand.slug}`);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, `/brands/${brand.slug}`)])
    ) as Partial<Record<SeoLocale, string>>
  );
  const image = brand.logoUrl || "/og-image.jpg";

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
      images: [{ url: image, width: 1200, height: 630, alt: brand.name }],
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
}: StaticPageMetadataProps): Metadata {
  const pageUrl = localizedUrl(locale, path);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, path)])
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
}

export async function generateStoreMetadata({
  locale,
  store,
}: StoreMetadataProps): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "seo" });
  const params = contentParams(locale);
  const title = t("storeTitle", { name: store.name });
  const description =
    store.description || t("storeDescription", { ...params, name: store.name });

  const storeUrl = localizedUrl(locale, `/stores/${store.slug}`);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, `/stores/${store.slug}`)])
    ) as Partial<Record<SeoLocale, string>>
  );
  const image = store.logoUrl || "/og-image.jpg";

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
      images: [{ url: image, width: 1200, height: 630, alt: store.name }],
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
