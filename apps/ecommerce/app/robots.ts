import type { MetadataRoute } from "next";
import { headers } from "next/headers";
import { isAccountHost } from "@workspace/lib/storefront/platform-hosts";
import { SITEMAP_BASE_URL } from "@/lib/constants";
import { accountRobots, marketplaceRobots } from "@/lib/sitemap/robots.lib";

/**
 * The marketplace robots.txt. Store hosts never reach this file: proxy.ts
 * rewrites their /robots.txt to the store's own (P5-04,
 * app/[locale]/storefront/[subdomain]/robots.txt). account.<root> gets its
 * own, which also keeps crawlers off the one-time download links (F-108c).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  if (isAccountHost((await headers()).get("host"))) return accountRobots();
  return marketplaceRobots(SITEMAP_BASE_URL);
}
