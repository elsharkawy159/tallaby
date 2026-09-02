import type { Metadata } from "next";
import { BASE_URL, DEFAULT_CURRENCY } from "./constants";
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

export function generateProductMetadata({
  locale,
  product,
  alternateSlug,
}: ProductMetadataProps): Metadata {
  const title = `${product.title} | Tallaby.com`;
  const description =
    product.description ||
    `Buy ${product.title} from ${product.brand.name} on Tallaby.com. ${product.category.name} with ${product.averageRating > 0 ? `${product.averageRating}★ rating` : "great quality"}. Fast shipping and secure checkout.`;

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
    title,
    description,
    keywords: [
      product.title,
      product.brand.name,
      product.category.name,
      "buy online",
      "tallaby",
      "ecommerce",
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

export function generateCategoryMetadata({
  locale,
  category,
}: CategoryMetadataProps): Metadata {
  const title = `${category.name} | Shop ${category.name} on Tallaby.com`;
  const description =
    category.description ||
    `Shop ${category.name} products on Tallaby.com. ${category.productCount ? `${category.productCount}+ products` : "Wide selection"} available with fast shipping and great prices.`;

  // Categories share one slug across locales, so both language URLs exist
  // whenever the category exists at all.
  const categoryUrl = localizedUrl(locale, `/categories/${category.slug}`);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, `/categories/${category.slug}`)])
    ) as Partial<Record<SeoLocale, string>>
  );

  return {
    title,
    description,
    keywords: [
      category.name,
      "shop online",
      "tallaby",
      "ecommerce",
      "buy",
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
          alt: `Shop ${category.name} on Tallaby.com`,
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

export function generateBrandMetadata({ locale, brand }: BrandMetadataProps): Metadata {
  const title = `${brand.name} | Shop ${brand.name} on Tallaby.com`;
  const description =
    brand.description ||
    `Shop official ${brand.name} products on Tallaby.com. ${brand.productCount ? `${brand.productCount}+ products` : "Wide selection"} available with fast shipping.`;

  const brandUrl = localizedUrl(locale, `/brands/${brand.slug}`);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, `/brands/${brand.slug}`)])
    ) as Partial<Record<SeoLocale, string>>
  );
  const image = brand.logoUrl || "/og-image.jpg";

  return {
    title,
    description,
    keywords: [brand.name, "shop online", "tallaby", "ecommerce", "buy"],
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
    title,
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

export function generateStoreMetadata({ locale, store }: StoreMetadataProps): Metadata {
  const title = `${store.name} | Tallaby.com`;
  const description =
    store.description ||
    `Shop products from ${store.name} on Tallaby.com. ${store.productCount ? `${store.productCount}+ products` : "Browse their storefront"} and shop with cash on delivery.`;

  const storeUrl = localizedUrl(locale, `/stores/${store.slug}`);
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, `/stores/${store.slug}`)])
    ) as Partial<Record<SeoLocale, string>>
  );
  const image = store.logoUrl || "/og-image.jpg";

  return {
    title,
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

export function generateHomeMetadata(locale: SeoLocale): Metadata {
  const title = "Tallaby.com – Your Everything Store";
  const description =
    "Tallaby.com is a global online marketplace offering millions of products across electronics, fashion, home essentials, beauty, and more. Shop securely, fast, and conveniently like Amazon.";
  const homeUrl = localizedUrl(locale, "");
  const languages = buildLanguageAlternates(
    Object.fromEntries(
      routing.locales.map((l) => [l, localizedUrl(l, "")])
    ) as Partial<Record<SeoLocale, string>>
  );

  return {
    title,
    description,
    openGraph: {
      type: "website",
      locale: OG_LOCALE[locale],
      url: homeUrl,
      siteName: "Tallaby.com",
      title,
      description,
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
      title,
      description,
      images: ["/og-image.jpg"],
    },
    alternates: {
      canonical: homeUrl,
      languages,
    },
  };
}
