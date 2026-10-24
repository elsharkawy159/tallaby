import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getMarketingPosts } from "@/lib/marketing/blog.server";
import { localizedUrl } from "@/lib/marketing/metadata.lib";
import { getTemplateGallery } from "@/lib/marketing/templates.server";

const STATIC_PATHS = ["/", "/templates", "/pricing", "/blog", "/about", "/careers", "/contact", "/faq", "/terms", "/privacy", "/follow-us"];

function entry(path: string, locales: readonly string[] = routing.locales, lastModified?: string): MetadataRoute.Sitemap[number] {
  const primary = locales.includes(routing.defaultLocale) ? routing.defaultLocale : locales[0]!;
  return {
    url: localizedUrl(primary, path),
    ...(lastModified && { lastModified }),
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, localizedUrl(l, path)])),
    },
  };
}

/**
 * tallaby.com pages, templates (from the gallery) and blog posts. Blog posts
 * can be limited to one locale (`lang:xx` tags), so each post lists only the
 * locales it is published in; noindex posts are left out.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [gallery, ...postsByLocale] = await Promise.all([
    getTemplateGallery(routing.defaultLocale),
    ...routing.locales.map((locale) => getMarketingPosts(locale)),
  ]);

  const posts = new Map<string, { locales: string[]; lastModified?: string }>();
  routing.locales.forEach((locale, i) => {
    for (const post of postsByLocale[i] ?? []) {
      if (post.seo?.noindex || !post.hasArticle) continue;
      const seen = posts.get(post.id) ?? { locales: [], lastModified: post.updatedAt ?? post.date };
      seen.locales.push(locale);
      posts.set(post.id, seen);
    }
  });

  return [
    ...STATIC_PATHS.map((path) => entry(path)),
    ...gallery.map((t) => entry(`/templates/${t.id}`)),
    ...[...posts].map(([id, { locales, lastModified }]) => entry(`/blog/${id}`, locales, lastModified)),
  ];
}
