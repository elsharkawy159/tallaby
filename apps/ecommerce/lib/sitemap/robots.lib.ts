/**
 * robots.txt rules for the marketplace (app/robots.ts) and for store hosts
 * (P5-04). Pure; the store route serializes with `serializeRobots`, the
 * marketplace keeps Next's metadata route.
 */
import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";

/** Private/transactional sections, disallowed in every locale. */
export const PRIVATE_PATHS = ["/cart", "/profile", "/onboarding", "/auth", "/wishlist", "/orders/"];

/** Model-training crawlers (not search). */
export const TRAINING_CRAWLERS = ["GPTBot", "ClaudeBot", "anthropic-ai", "CCBot"] as const;

// The default locale (ar; a store's own default language on its host) is
// unprefixed; every other locale lives under /{locale} ("as-needed"), so those
// are the prefixed copies to block.

/**
 * The same crawl rules on every host (store paths are a subset of these).
 * `defaultLocale`: the host's unprefixed language; an English-default store
 * blocks the /ar copies instead of the /en ones.
 */
export function crawlRules(defaultLocale: string = routing.defaultLocale): MetadataRoute.Robots["rules"] {
  const prefixed = routing.locales.filter((l) => l !== defaultLocale);
  return [
    {
      userAgent: "*",
      allow: "/",
      disallow: [
        ...PRIVATE_PATHS,
        ...prefixed.flatMap((l) => PRIVATE_PATHS.map((p) => `/${l}${p}`)),
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
  ];
}

export function marketplaceRobots(baseUrl: string): MetadataRoute.Robots {
  return { rules: crawlRules(), sitemap: `${baseUrl}/sitemap.xml`, host: baseUrl };
}

/**
 * A store host's robots.txt: its own sitemap and host (custom domain when
 * live). A store kept out of search (no products, indexing off) lists no
 * sitemap; its pages carry `noindex`, which crawlers can only see when the
 * pages stay crawlable, so nothing extra is disallowed.
 */
export function storeRobots(
  baseUrl: string,
  { indexable, defaultLocale }: { indexable: boolean; defaultLocale?: string },
): MetadataRoute.Robots {
  return { rules: crawlRules(defaultLocale), ...(indexable && { sitemap: `${baseUrl}/sitemap.xml` }), host: baseUrl };
}

const list = <T>(value: T | T[] | undefined): T[] => (value === undefined ? [] : Array.isArray(value) ? value : [value]);

/** robots.txt text, in the format Next's metadata route writes. */
export function serializeRobots(data: MetadataRoute.Robots): string {
  let content = "";
  for (const rule of list(data.rules)) {
    for (const agent of list(rule.userAgent ?? "*")) content += `User-Agent: ${agent}\n`;
    for (const item of list(rule.allow)) content += `Allow: ${item}\n`;
    for (const item of list(rule.disallow)) content += `Disallow: ${item}\n`;
    if (rule.crawlDelay) content += `Crawl-delay: ${rule.crawlDelay}\n`;
    content += "\n";
  }
  if (data.host) content += `Host: ${data.host}\n`;
  for (const item of list(data.sitemap)) content += `Sitemap: ${item}\n`;
  return content;
}
