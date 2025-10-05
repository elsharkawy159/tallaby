import type { Metadata } from "next";
import { BASE_URL } from "./constants";


interface ProductMetadataProps {
  product: {
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
  };
}

interface CategoryMetadataProps {
  category: {
    name: string;
    slug: string;
    description?: string;
    productCount?: number;
  };
}

export function generateProductMetadata({
  product,
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
  const productUrl = `${BASE_URL}/products/${product.slug}`;

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
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      site: "@tallaby",
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      "product:price:amount": price.toString(),
      "product:price:currency": "USD",
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

export function generateCategoryMetadata({
  category,
}: CategoryMetadataProps): Metadata {
  const title = `${category.name} | Shop ${category.name} on Tallaby.com`;
  const description =
    category.description ||
    `Shop ${category.name} products on Tallaby.com. ${category.productCount ? `${category.productCount}+ products` : "Wide selection"} available with fast shipping and great prices.`;

  const categoryUrl = `${BASE_URL}/products?category=${category.slug}`;

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
      locale: "en_US",
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

export function generateHomeMetadata(): Metadata {
  return {
    title: "Tallaby.com – Your Everything Store",
    description:
      "Tallaby.com is a global online marketplace offering millions of products across electronics, fashion, home essentials, beauty, and more. Shop securely, fast, and conveniently like Amazon.",
    openGraph: {
      type: "website",
      locale: "en_US",
      url: BASE_URL,
      siteName: "Tallaby.com",
      title: "Tallaby.com – Your Everything Store",
      description:
        "Discover endless shopping on Tallaby.com – electronics, fashion, home, beauty, and more. Worldwide delivery, secure checkout, and trusted sellers.",
      images: [
        {
          url: "/og-image.jpg",
          width: 1200,
          height: 630,
          alt: "Tallaby.com – Your Everything Store",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      site: "@tallaby",
      title: "Tallaby.com – Your Everything Store",
      description:
        "Tallaby.com brings you Amazon-like shopping with millions of products, great prices, and secure delivery.",
      images: ["/og-image.jpg"],
    },
    alternates: {
      canonical: BASE_URL,
    },
  };
}
