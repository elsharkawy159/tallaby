import type { MetadataRoute } from "next";
import { SITEMAP_BASE_URL } from "@/lib/constants";
import { marketplaceRobots } from "@/lib/sitemap/robots.lib";

/**
 * The marketplace robots.txt. Store hosts never reach this file: proxy.ts
 * rewrites their /robots.txt to the store's own (P5-04,
 * app/[locale]/storefront/[subdomain]/robots.txt).
 */
export default function robots(): MetadataRoute.Robots {
  return marketplaceRobots(SITEMAP_BASE_URL);
}
