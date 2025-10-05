import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  // Vendor dashboard should not be included in sitemap
  return [];
}
