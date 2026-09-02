import { BASE_URL, DEFAULT_CURRENCY } from "./constants";
import { TALLABY_SOCIAL_SAME_AS } from "./social-links";
import { TALLABY_CONTACT_EMAIL } from "./contact";
import { localizedUrl, type SeoLocale } from "./metadata";

interface Product {
  id: string;
  title: string;
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
  stockCount?: number;
  status?: string;
}

interface Category {
  name: string;
  slug: string;
  description?: string;
  productCount?: number;
}

interface BreadcrumbItem {
  name: string;
  url: string;
}

export function generateProductStructuredData(product: Product, locale: SeoLocale = "en") {
  const productUrl = localizedUrl(locale, `/products/${product.slug}`);
  const imageUrl = product.images?.[0] || `${BASE_URL}/og-image.jpg`;

  const offers = {
    "@type": "Offer",
    price: product.price.final,
    priceCurrency: DEFAULT_CURRENCY,
    availability:
      product.status === "active" && (product.stockCount || 0) > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
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
    image: product.images.length > 0 ? product.images : [imageUrl],
    url: productUrl,
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

export function generateCategoryStructuredData(category: Category, locale: SeoLocale = "en") {
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
          name: "Home",
          item: localizedUrl(locale, ""),
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Products",
          item: localizedUrl(locale, "/products"),
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
        url: `${BASE_URL}/logo.png`,
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
    logo: `${BASE_URL}/logo.png`,
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
