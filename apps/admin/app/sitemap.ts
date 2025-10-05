import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Admin dashboard should not be included in sitemap
  return [];
}
