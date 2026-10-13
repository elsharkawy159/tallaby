import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { SITEMAP_BASE_URL } from "@/lib/constants";

/** Private/transactional sections, disallowed in every locale. */
const PRIVATE_PATHS = ["/cart", "/profile", "/onboarding", "/auth", "/wishlist", "/orders/"];

/** Model-training crawlers (not search). */
const TRAINING_CRAWLERS = ["GPTBot", "ClaudeBot", "anthropic-ai", "CCBot"] as const;

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
      // Block crawlers that collect model-training data. AI *search* and
      // user-triggered fetchers (OAI-SearchBot, ChatGPT-User, Claude-SearchBot,
      // Claude-User, PerplexityBot) fall through to "*" so products can be
      // found and recommended in AI answers, with the same private-path rules.
      {
        userAgent: [...TRAINING_CRAWLERS],
        disallow: "/",
      },
    ],
    sitemap: `${SITEMAP_BASE_URL}/sitemap.xml`,
    host: SITEMAP_BASE_URL,
  };
}
