import { BASE_URL, DEFAULT_CURRENCY } from "./constants";
import { TALLABY_SOCIAL_SAME_AS } from "./social-links";
import { TALLABY_CONTACT_EMAIL } from "./contact";

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

export function generateProductStructuredData(product: Product) {
  const productUrl = `${BASE_URL}/products/${product.slug}`;
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
      url: `${BASE_URL}/products?category=${product.category.slug}`,
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

export function generateCategoryStructuredData(category: Category) {
  const categoryUrl = `${BASE_URL}/products?category=${category.slug}`;

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
          item: BASE_URL,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Products",
          item: `${BASE_URL}/products`,
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
    url: "https://www.tallaby.com",
    description:
      "Tallaby.com is a global online marketplace offering millions of products across electronics, fashion, home essentials, beauty, and more.",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://www.tallaby.com/search?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
    publisher: {
      "@type": "Organization",
      name: "Tallaby.com",
      url: "https://www.tallaby.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.tallaby.com/logo.png",
      },
    },
  };
}

export function generateOrganizationStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Tallaby.com",
    url: "https://www.tallaby.com",
    logo: "https://www.tallaby.com/logo.png",
    description:
      "Tallaby.com is a global online marketplace offering millions of products across electronics, fashion, home essentials, beauty, and more.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+1-800-TALLABY",
      email: TALLABY_CONTACT_EMAIL,
      contactType: "customer service",
      availableLanguage: ["English", "Arabic"],
    },
    sameAs: TALLABY_SOCIAL_SAME_AS,
  };
}
