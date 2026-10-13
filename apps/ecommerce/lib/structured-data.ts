import {
  BASE_URL,
  DEFAULT_CURRENCY,
  DELIVERY_ESTIMATE_OTHER,
  RETURN_WINDOW_DAYS,
  SHIPPING_COST,
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
  status?: string;
  /** Product or its seller ships free (no delivery fee for this item). */
  freeDelivery?: boolean;
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

/** "2-5" -> [2, 5]; the widest (non-metro) estimate, so it is never optimistic. */
const [MIN_TRANSIT_DAYS, MAX_TRANSIT_DAYS] = DELIVERY_ESTIMATE_OTHER.split("-").map(Number);

/** Merchant-listing shipping/returns, from the same constants checkout and the policy pages use. */
function offerShippingDetails(freeDelivery: boolean) {
  return {
    "@type": "OfferShippingDetails",
    shippingRate: {
      "@type": "MonetaryAmount",
      value: freeDelivery ? 0 : Number(SHIPPING_COST),
      currency: DEFAULT_CURRENCY,
    },
    shippingDestination: { "@type": "DefinedRegion", addressCountry: "EG" },
    deliveryTime: {
      "@type": "ShippingDeliveryTime",
      handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
      transitTime: {
        "@type": "QuantitativeValue",
        minValue: MIN_TRANSIT_DAYS,
        maxValue: MAX_TRANSIT_DAYS,
        unitCode: "DAY",
      },
    },
  };
}

const MERCHANT_RETURN_POLICY = {
  "@type": "MerchantReturnPolicy",
  applicableCountry: "EG",
  returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
  merchantReturnDays: RETURN_WINDOW_DAYS,
  returnMethod: "https://schema.org/ReturnByMail",
  // Returns are free within the window (the original delivery fee isn't refunded).
  returnFees: "https://schema.org/FreeReturn",
};

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

export function generateProductStructuredData(product: Product, locale: SeoLocale = "en") {
  const productUrl = localizedUrl(locale, `/products/${product.slug}`);
  const images = (product.images ?? [])
    .filter((image) => image?.trim())
    .map(absoluteProductImageUrl);

  const offers = {
    "@type": "Offer",
    price: product.price.final,
    priceCurrency: DEFAULT_CURRENCY,
    availability:
      product.status === "active" && (product.stockCount || 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    itemCondition: schemaItemCondition(product.condition),
    priceValidUntil: priceValidUntil(),
    shippingDetails: offerShippingDetails(Boolean(product.freeDelivery)),
    hasMerchantReturnPolicy: MERCHANT_RETURN_POLICY,
    url: productUrl,
    seller: {
      "@type": "Organization",
      name: "Tallaby.com",
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
    image: images.length > 0 ? images : [`${BASE_URL}/og-image.jpg`],
    url: productUrl,
    ...(product.sku ? { sku: product.sku } : {}),
    brand: {
      "@type": "Brand",
      name: product?.brand?.name ?? "",
    },
    category: product.category ? {
      "@type": "Thing",
      name: product?.category?.name ?? "",
      url: localizedUrl(locale, `/categories/${product.category.slug}`),
    } : undefined,
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
      category.description || `Shop ${category.name} products on Tallaby.com`,
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
      "Tallaby is an Egypt-first multi-vendor marketplace offering products across categories from independent sellers.",
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
      "Tallaby is an Egypt-first multi-vendor marketplace offering products across categories from independent sellers.",
    contactPoint: {
      "@type": "ContactPoint",
      email: TALLABY_CONTACT_EMAIL,
      contactType: "customer service",
      availableLanguage: ["English", "Arabic"],
    },
    sameAs: TALLABY_SOCIAL_SAME_AS,
  };
}
