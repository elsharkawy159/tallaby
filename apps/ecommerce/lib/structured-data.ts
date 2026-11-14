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
  /**
   * Variants at different prices: the product is then a `ProductGroup` whose
   * variants each carry their own Offer. Absent (or empty) for a single-price
   * product, which keeps one Offer.
   */
  variants?: ProductJsonLdVariant[];
}

/** One variant of a `ProductGroup`, as the store product feed lists it (product-feed.lib.ts). */
export interface ProductJsonLdVariant {
  /** `product_variants.id`: `?variant=<id>` preselects it on the product page. */
  id: string;
  /** "Red / XL": the variant's values (its title when it has no options). */
  label: string;
  sku?: string | null;
  /** The variant's own photos first, then the product's (paths or URLs). */
  images: string[];
  price: ProductJsonLdInput["price"];
  inStock: boolean;
  color?: string | null;
  size?: string | null;
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
type JsonLdStore = { home: string; sellerName: string; currency?: string };

const jsonLdImages = (images: readonly string[] | null | undefined) =>
  [...new Set((images ?? []).filter((image) => image?.trim()).map(absoluteProductImageUrl))];

/** One Offer: price, Google's strikethrough compare-at price, availability, shipping and the store as seller. */
function productOffer(
  offer: { price: ProductJsonLdInput["price"]; inStock: boolean; url: string; shippingDetails?: readonly object[] },
  condition: string | null | undefined,
  store: JsonLdStore,
) {
  const currency = store.currency ?? DEFAULT_CURRENCY;
  const list = offer.price.list;
  return {
    "@type": "Offer",
    price: offer.price.final,
    priceCurrency: currency,
    // Google merchant listings: the compare-at price as a strikethrough price.
    ...(list != null && list > offer.price.final
      ? {
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            priceType: "https://schema.org/StrikethroughPrice",
            price: list,
            priceCurrency: currency,
          },
        }
      : {}),
    availability: offer.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    itemCondition: schemaItemCondition(condition),
    priceValidUntil: offer.price.validUntil || priceValidUntil(),
    url: offer.url,
    ...(offer.shippingDetails?.length ? { shippingDetails: offer.shippingDetails } : {}),
    seller: {
      "@type": "Organization",
      name: store.sellerName,
    },
  };
}

export function generateProductStructuredData(product: ProductJsonLdInput, store: JsonLdStore) {
  const productUrl = `${store.home}/products/${product.slug}`;
  const images = jsonLdImages(product.images);

  const offers = productOffer(
    { price: product.price, inStock: product.inStock, url: productUrl, shippingDetails: product.shippingDetails },
    product.condition,
    store,
  );

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

/**
 * A product whose variants sell at different prices, as Google's variant
 * markup (ProductGroup + hasVariant): one Product per variant with its own
 * Offer (price, stock, shipping), `?variant=<id>` URL, SKU and colour/size.
 * The group id is the product id, as the store feed's `item_group_id`, and
 * every variant URL is the one the feed links, so Search and Merchant Center
 * see the same items. Ratings belong to the group.
 */
export function generateProductGroupStructuredData(product: ProductJsonLdInput, store: JsonLdStore) {
  const productUrl = `${store.home}/products/${product.slug}`;
  const variants = product.variants ?? [];
  const images = jsonLdImages(product.images);
  const variesBy = [
    ...(variants.some((v) => v.color) ? ["https://schema.org/color"] : []),
    ...(variants.some((v) => v.size) ? ["https://schema.org/size"] : []),
  ];
  const aggregateRating = customerAggregateRating(product.reviews);
  const review = aggregateRating ? customerReviews(product.reviews) : [];

  const hasVariant = variants.map((variant) => {
    const url = `${productUrl}?variant=${encodeURIComponent(variant.id)}`;
    const variantImages = jsonLdImages(variant.images);
    return {
      "@type": "Product",
      name: variant.label ? `${product.title} - ${variant.label}` : product.title,
      ...(variant.sku ? { sku: variant.sku } : {}),
      ...(variantImages.length ? { image: variantImages } : {}),
      url,
      ...(variant.color ? { color: variant.color } : {}),
      ...(variant.size ? { size: variant.size } : {}),
      offers: productOffer(
        { price: variant.price, inStock: variant.inStock, url, shippingDetails: variant.shippingDetails },
        product.condition,
        store,
      ),
    };
  });

  return {
    "@context": "https://schema.org",
    "@type": "ProductGroup",
    name: product.title,
    description: product.description,
    ...(images.length > 0 ? { image: images } : {}),
    url: productUrl,
    productGroupID: product.id,
    ...(product.brand?.name ? { brand: { "@type": "Brand", name: product.brand.name } } : {}),
    ...(product.categoryName ? { category: product.categoryName } : {}),
    ...(variesBy.length ? { variesBy } : {}),
    hasVariant,
    ...(aggregateRating ? { aggregateRating } : {}),
    ...(review.length ? { review } : {}),
  };
}

/** The store product page's JSON-LD: a ProductGroup for variants at different prices, else a Product with one Offer. */
export function generateStoreProductStructuredData(product: ProductJsonLdInput, store: JsonLdStore) {
  return product.variants?.length ? generateProductGroupStructuredData(product, store) : generateProductStructuredData(product, store);
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
