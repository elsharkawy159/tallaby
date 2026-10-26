import { cache } from "react";
import { cacheProfiles, createCachedQuery, templateTags } from "@workspace/cache";
import { codeTemplateConfig, getPublicTemplate, offeredTemplates } from "@workspace/lib/store-sites/server";
import { siteConfigSchema, type SiteConfig } from "@workspace/store-sections";
import { resolveTemplateMeta, templateMeta, templateOutline, type TemplateMeta } from "@workspace/store-sections/templates";
import { buildGallery, type CatalogTemplate, type GalleryEntry } from "./templates.lib";

/**
 * The tallaby.com gallery: every code template (templates are code-only since
 * 2026-10-27; 0109 dropped the template tables) with a valid config. Cached
 * because each entry is built from a ~95 KB config; a deploy brings changes.
 */
const getCachedCatalog = createCachedQuery({
  name: "marketing:template-catalog:v3",
  ttl: cacheProfiles.taxonomy,
  tags: () => [templateTags.catalog()],
  query: async (): Promise<CatalogTemplate[]> =>
    offeredTemplates().flatMap((template) => {
      const config = codeTemplateConfig(template.key);
      if (!config) return []; // A broken template is never offered.
      const meta = templateMeta(template);
      return [
        {
          key: template.key,
          name: template.name,
          description: template.description,
          category: template.category,
          thumbnailUrl: null,
          previewUrl: null,
          isDefault: !!template.isDefault,
          isPremium: false,
          price: null,
          sortOrder: template.sortOrder,
          palette: meta.palette,
          pages: templateOutline(config).map((page) => ({
            slug: page.slug,
            isHome: page.isHome,
            name: page.name,
            ...(meta.pageNames[page.slug] && { names: meta.pageNames[page.slug] }),
          })),
        },
      ];
    }),
});

/** The gallery for a locale. If the database is unreachable, the gallery is empty rather than failing the page. */
export const getTemplateGallery = cache(async (locale: string): Promise<GalleryEntry[]> => {
  let rows: CatalogTemplate[] = [];
  try {
    rows = await getCachedCatalog();
  } catch (error) {
    console.error("[marketing] template catalog failed", error);
  }
  return buildGallery(rows, locale);
});

export async function findGalleryEntry(locale: string, id: string): Promise<GalleryEntry | null> {
  return (await getTemplateGallery(locale)).find((entry) => entry.id === id) ?? null;
}

const getCachedTemplatePreview = createCachedQuery({
  name: "marketing:template-preview:v3",
  ttl: cacheProfiles.taxonomy,
  tags: (_key: string) => [templateTags.catalog()],
  query: (key: string) => getPublicTemplate(key),
});

export type TemplatePreview = { config: SiteConfig; meta: TemplateMeta };

/**
 * An active template's current site config and meta (demo store, page names)
 * for the preview frame; null when unknown, deleted or unreachable.
 */
export const getTemplatePreview = cache(async (key: string): Promise<TemplatePreview | null> => {
  try {
    const stored = await getCachedTemplatePreview(key);
    // Re-parsed: the cache hands back plain JSON.
    const parsed = siteConfigSchema.safeParse(stored?.config);
    return stored && parsed.success ? { config: parsed.data, meta: resolveTemplateMeta(stored.meta, key) } : null;
  } catch (error) {
    console.error("[marketing] template config failed", error);
    return null;
  }
});
