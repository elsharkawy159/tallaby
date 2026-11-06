import {
  BASE_URL,
  DEFAULT_CURRENCY,
} from "./constants";
import { TALLABY_SOCIAL_SAME_AS } from "./social-links";
import { TALLABY_CONTACT_EMAIL } from "./contact";
import { absoluteProductImageUrl, localizedUrl, type SeoLocale } from "./metadata";

/** Square brand mark (1622x1622) — Google needs >=112px for the Organization logo. */
const SITE_LOGO_URL = `${BASE_URL}/logo/logo.png`;

/** A review as the product JSON-LD reads it; only `source: "customer"` ones are emitted. */
export interface ProductJsonLdReview {
  rating: number;
  /** `reviews.source` (0111): a seller-added review is self-serving to Google, so it never counts. */
  source: string;
  authorName?: string | null;
  isAnonymous?: boolean | null;
  title?: string | null;
  body?: string | null;
  createdAt?: string | null;
}

export interface ProductJsonLdInput {
  id: string;
  title: string;
  slug: string;
  sku?: string | null;
  condition?: string | null;
  description: string;
  price: {
    final: number;
    /** The compare-at price, when above `final`: emitted as Google's strikethrough price. */
    list?: number | null;
    /** The offer's end (YYYY-MM-DD) while a discount runs; else a year ahead. */
    validUntil?: string | null;
  };
  images: string[];
  brand?: { name: string } | null;
  /** The category name for `Product.category`. */
  categoryName?: string | null;
  /** Active and in stock (untracked stock counts as in stock). */
  inStock: boolean;
  /** Approved reviews; seller-added ones are dropped here. */
  reviews: ProductJsonLdReview[];
  /** `OfferShippingDetails` entries (store-seo/offer-shipping.lib.ts). */
  shippingDetails?: readonly object[];
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

/** Reviews written into `review`: Google reads a handful, the aggregate carries the rest. */
const MAX_JSONLD_REVIEWS = 5;

const validRating = (r: ProductJsonLdReview) => Number.isFinite(r.rating) && r.rating >= 1 && r.rating <= 5;

/** The customer reviews' rating, or null when there are none (seller-added reviews never count). */
export function customerAggregateRating(reviews: readonly ProductJsonLdReview[]) {
  const ratings = reviews.filter((r) => r.source === "customer" && validRating(r)).map((r) => r.rating);
  if (!ratings.length) return null;
  const average = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
  return {
    "@type": "AggregateRating" as const,
    ratingValue: Math.round(average * 10) / 10,
    reviewCount: ratings.length,
    bestRating: 5,
    worstRating: 1,
  };
}

/** A few named customer reviews; anonymous ones count in the aggregate only. */
function customerReviews(reviews: readonly ProductJsonLdReview[]) {
  return reviews
    .filter((r) => r.source === "customer" && validRating(r) && !r.isAnonymous && r.authorName?.trim())
    .slice(0, MAX_JSONLD_REVIEWS)
    .map((r) => ({
      "@type": "Review" as const,
      author: { "@type": "Person" as const, name: r.authorName!.trim() },
      reviewRating: { "@type": "Rating" as const, ratingValue: r.rating, bestRating: 5, worstRating: 1 },
      ...(r.title?.trim() ? { name: r.title.trim() } : {}),
      ...(r.body?.trim() ? { reviewBody: r.body.trim() } : {}),
      ...(r.createdAt ? { datePublished: r.createdAt.slice(0, 10) } : {}),
    }));
}

/**
 * A product on a store's own site. Every URL and the seller come from the store.
 * Shipping comes from the store's own zones, only where one price holds for a
 * whole country (store-seo/offer-shipping.lib.ts). Returns are left out: a
 * return policy needs the owner's decision on what each store promises.
 */
export function generateProductStructuredData(
  product: ProductJsonLdInput,
  store: { home: string; sellerName: string; currency?: string },
) {
  const productUrl = `${store.home}/products/${product.slug}`;
  const currency = store.currency ?? DEFAULT_CURRENCY;
  const images = (product.images ?? [])
    .filter((image) => image?.trim())
    .map(absoluteProductImageUrl);
  const list = product.price.list;

  const offers = {
    "@type": "Offer",
    price: product.price.final,
    priceCurrency: currency,
    // Google merchant listings: the compare-at price as a strikethrough price.
    ...(list != null && list > product.price.final
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/StrikethroughPrice",
            price: list,
            priceCurrency: currency,
          },
        }
      : {}),
    availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: schemaItemCondition(product.condition),
    priceValidUntil: product.price.validUntil || priceValidUntil(),
    url: productUrl,
    ...(product.shippingDetails?.length ? { shippingDetails: product.shippingDetails } : {}),
    seller: {
      "@type": "Organization",
      name: store.sellerName,
    },
  };

  const aggregateRating = customerAggregateRating(product.reviews);
  const review = aggregateRating ? customerReviews(product.reviews) : [];

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    ...(images.length > 0 ? { image: images } : {}),
    url: productUrl,
    ...(product.sku ? { sku: product.sku } : {}),
    ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.categoryName ? { category: product.categoryName } : {}),
    offers,
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(review.length ? { review } : {}),
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
