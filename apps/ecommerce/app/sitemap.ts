import { BASE_URL } from "@/lib/constants";
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const currentDate = new Date();

  // Static pages
  const staticPages = [
    {
      url: BASE_URL,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 1,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: currentDate,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: currentDate,
      changeFrequency: "monthly" as const,
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/become-seller`,
      lastModified: currentDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
  ];

  // Category pages (you can expand this with actual categories from your database)
  const categories = [
    "electronics",
    "fashion",
    "home",
    "beauty",
    "sports",
    "books",
    "toys",
    "automotive",
    "health",
    "jewelry",
  ];

  const categoryPages = categories.map((category) => ({
    url: `${BASE_URL}/products?category=${category}`,
    lastModified: currentDate,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  // Note: For dynamic product pages, you would typically fetch from your database
  // and generate entries like this:
  // const products = await getProducts()
  // const productPages = products.map((product) => ({
  //   url: `${BASE_URL}/products/${product.slug}`,
  //   lastModified: new Date(product.updatedAt),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }))

  return [...staticPages, ...categoryPages];
}
