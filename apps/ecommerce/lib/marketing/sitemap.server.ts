import { routing } from "@/i18n/routing";
import { getMarketingPosts } from "@/lib/marketing/blog.server";
import { contentPagePaths } from "@/lib/marketing/content-routes.lib";
import { type MarketingSitemapEntry, sitemapEntries } from "@/lib/marketing/seo.lib";
import { pageLastModified, STATIC_PAGE_LASTMOD } from "@/lib/marketing/sitemap.lib";
import { directorySitemapEntries } from "@/lib/marketing/store-directory.lib";
import { getDirectoryStores } from "@/lib/marketing/stores.server";
import { getTemplateGallery } from "@/lib/marketing/templates.server";

const STATIC_PATHS = Object.keys(STATIC_PAGE_LASTMOD);

/**
 * The entries of tallaby.com's /sitemap.xml (app/sitemap.xml/route.ts): pages,
 * templates (from the gallery), blog posts, the later /stores pages and each
 * listed store's home address (so search engines find new stores from
 * tallaby.com). Blog posts can be limited to one locale (`lang:xx` tags), so
 * each post lists only the locales it is published in; noindex posts are left out. Pages carry the dates in sitemap.lib.ts;
 * templates have no change date in the code catalog, so they carry none.
 */
export async function getMarketingSitemapEntries(): Promise<MarketingSitemapEntry[]> {
  const [gallery, stores, ...postsByLocale] = await Promise.all([
    getTemplateGallery(routing.defaultLocale),
    getDirectoryStores(),
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
    ...STATIC_PATHS.flatMap((path) => sitemapEntries(path, undefined, pageLastModified(path))),
    ...contentPagePaths().flatMap((path) => sitemapEntries(path, undefined, pageLastModified(path))),
    ...gallery.flatMap((t) => sitemapEntries(`/templates/${t.id}`)),
    ...[...posts].flatMap(([id, { locales, lastModified }]) => sitemapEntries(`/blog/${id}`, locales, lastModified)),
    ...directorySitemapEntries(stores),
  ];
}
