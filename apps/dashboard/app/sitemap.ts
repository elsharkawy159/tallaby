import type { MetadataRoute } from "next";
import { PUBLIC_ENTRY_PATH, dashboardOrigin } from "@/lib/seo/public-entry.lib";

// Only the public sign-in page; every other dashboard page is private and noindex.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${dashboardOrigin()}${PUBLIC_ENTRY_PATH}`, changeFrequency: "monthly", priority: 1 }];
}
