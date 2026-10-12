import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITEMAP_BASE_URL } from "@/lib/constants";

/** Private/transactional sections, disallowed in every locale. */
const PRIVATE_PATHS = ["/cart", "/profile", "/onboarding", "/auth", "/wishlist", "/orders/"];

// The default locale (ar) is unprefixed; every other locale lives under
// /{locale} ("as-needed"), so those are the prefixed copies to block.
const prefixedLocales = routing.locales.filter((l) => l !== routing.defaultLocale);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          ...PRIVATE_PATHS,
          ...prefixedLocales.flatMap((l) => PRIVATE_PATHS.map((p) => `/${l}${p}`)),
          "/admin/",
          "/dashboard/",
          "/api/",
          "/private/",
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: "/",
      },
      {
        userAgent: "ChatGPT-User",
        disallow: "/",
      },
      {
        userAgent: "CCBot",
        disallow: "/",
      },
      {
        userAgent: "anthropic-ai",
        disallow: "/",
      },
      {
        userAgent: "Claude-Web",
        disallow: "/",
      },
    ],
    sitemap: `${SITEMAP_BASE_URL}/sitemap.xml`,
    host: SITEMAP_BASE_URL,
  };
}
