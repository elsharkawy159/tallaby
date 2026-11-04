import {
  BASE_URL,
  DEFAULT_CURRENCY,
} from "./constants";
import { TALLABY_SOCIAL_SAME_AS } from "./social-links";
import { TALLABY_CONTACT_EMAIL } from "./contact";
import { absoluteProductImageUrl, localizedUrl, type SeoLocale } from "./metadata";

/** Square brand mark (1622x1622) — Google needs >=112px for the Organization logo. */
const SITE_LOGO_URL = `${BASE_URL}/logo/logo.png`;

interface Product {
  id: string;
  title: string;
  slug: string;
  sku?: string | null;
  condition?: string | null;
  description: string;
  price: {
    final: number;
    list?: number;
  };
  images: string[];
  brand?: {
    id?: string;
    name: string;
    logoUrl?: string;
  };
  category?: {
    id?: string;
    name: string;
    slug: string;
  };
  averageRating: number;
  reviewCount: number;
  stockCount?: number;
  /** Not counted (0138, F-51): in stock while active, no stock count shown. */
  unlimitedStock?: boolean;
  status?: string;
}

interface Category {
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

interface BreadcrumbLabels {
  home: string;
  categories: string;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

/** Prices have no scheduled end; Google wants a date, so roll it a year ahead. */
function priceValidUntil(): string {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  return date.toISOString().slice(0, 10);
}

function schemaItemCondition(condition?: string | null): string {
  if (!condition || condition === "new") return "https://schema.org/NewCondition";
  if (condition === "renewed" || condition === "refurbished") {
    return "https://schema.org/RefurbishedCondition";
  }
  return "https://schema.org/UsedCondition";
}

/**
 * A product on a store's own site. Every URL and the seller come from the store.
 * Delivery cost and returns are left out: each seller sets their own, so a fixed
 * value here would tell Google something the store may not offer.
 */
export function generateProductStructuredData(
  product: Product,
  store: { home: string; sellerName: string; currency?: string },
) {
  const productUrl = `${store.home}/products/${product.slug}`;
  const images = (product.images ?? [])
    .filter((image) => image?.trim())
    .map(absoluteProductImageUrl);

  const offers = {
    "@type": "Offer",
    price: product.price.final,
    priceCurrency: store.currency ?? DEFAULT_CURRENCY,
    availability:
      product.status === "active" && (product.unlimitedStock || (product.stockCount || 0) > 0)
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    itemCondition: schemaItemCondition(product.condition),
    priceValidUntil: priceValidUntil(),
    url: productUrl,
    seller: {
      "@type": "Organization",
      name: store.sellerName,
    },
  };

  const aggregateRating =
    product.averageRating > 0
      ? {
          "@type": "AggregateRating",
          ratingValue: product.averageRating,
          reviewCount: product.reviewCount,
          bestRating: 5,
          worstRating: 1,
        }
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    ...(images.length > 0 ? { image: images } : {}),
    url: productUrl,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.category?.name ? { category: product.category.name } : {}),
    offers,
    ...(aggregateRating && { aggregateRating }),
    ...(product.stockCount && {
      additionalProperty: {
        "@type": "PropertyValue",
        name: "Stock Count",
        value: product.stockCount,
      },
    }),
  };
}

export function generateCategoryStructuredData(
  category: Category,
  locale: SeoLocale = "en",
  labels: BreadcrumbLabels = { home: "Home", categories: "Categories" }
) {
  const categoryUrl = localizedUrl(locale, `/categories/${category.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `${category.name} Products`,
    description:
      category.description || `Shop ${category.name} products`,
    url: categoryUrl,
    mainEntity: {
      "@type": "ItemList",
      name: `${category.name} Products`,
      description: category.description || `Browse ${category.name} products`,
      ...(category.productCount && { numberOfItems: category.productCount }),
    },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: labels.home,
          item: localizedUrl(locale, ""),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: labels.categories,
          item: localizedUrl(locale, "/categories"),
        },
        {
          "@type": "ListItem",
          position: 3,
          name: category.name,
          item: categoryUrl,
        },
      ],
    },
  };
}

export function generateBreadcrumbStructuredData(
  breadcrumbs: BreadcrumbItem[]
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateWebsiteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Tallaby.com",
    alternateName: "Tallaby",
    url: BASE_URL,
    description:
      "Tallaby is a platform for creating your own online store. Sellers build and run their store under their own name.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Tallaby.com",
      url: BASE_URL,
      logo: {
        "@type": "ImageObject",
        url: SITE_LOGO_URL,
      },
    },
  };
}

export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tallaby.com",
    url: BASE_URL,
    logo: SITE_LOGO_URL,
    description:
      "Tallaby is a platform for creating your own online store. Sellers build and run their store under their own name.",
    contactPoint: {
      "@type": "ContactPoint",
      email: TALLABY_CONTACT_EMAIL,
      contactType: "customer service",
      availableLanguage: ["English", "Arabic"],
    },
    sameAs: TALLABY_SOCIAL_SAME_AS,
  };
}
