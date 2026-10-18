import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { BLOG_POSTS } from "@/lib/blog.data";
import { localizedUrl } from "@/lib/metadata.lib";
import { TEMPLATES } from "@/lib/templates.data";

const STATIC_PATHS = ["/", "/templates", "/pricing", "/blog", "/about", "/careers", "/contact", "/faq", "/terms", "/privacy", "/follow-us"];

export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    ...STATIC_PATHS,
    ...TEMPLATES.map((t) => `/templates/${t.id}`),
    ...BLOG_POSTS.map((p) => `/blog/${p.id}`),
  ];

  return paths.map((path) => ({
    url: localizedUrl(routing.defaultLocale, path),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, localizedUrl(l, path)])),
    },
  }));
}
