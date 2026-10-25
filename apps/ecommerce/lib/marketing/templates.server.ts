import { cache } from "react";
import { cacheProfiles, createCachedQuery, templateTags } from "@workspace/cache";
import { and, asc, db, desc, eq, isNull, templateVersions, templates } from "@workspace/db";
import { getPublicTemplate } from "@workspace/lib/store-sites/server";
import { siteConfigSchema, type SiteConfig } from "@workspace/store-sections";
import { resolveTemplateMeta, templateOutline, type TemplateMeta } from "@workspace/store-sections/templates";
import { buildGallery, type CatalogTemplate, type GalleryEntry } from "./templates.lib";

/**
 * Active, not deleted templates for the tallaby.com gallery, with a valid
 * current version only (the dashboard gallery hides the others too). Swatches
 * and page names come from `templates.meta` (code fallback per field). Admin template edits
 * purge `templateTags.catalog()` (invalidateTemplateCatalog), so the gallery
 * and the preview frames follow without a deploy, so the TTL is only a 24 h
 * backstop: each refill reads every ~95 KB config (docs/egress-audit.md §1).
 */
const getCachedCatalog = createCachedQuery({
  name: "marketing:template-catalog:v2",
  ttl: cacheProfiles.taxonomy,
  tags: () => [templateTags.catalog()],
  query: async (): Promise<CatalogTemplate[]> => {
    const rows = await db
      .select({
        key: templates.key,
        name: templates.name,
        description: templates.description,
        category: templates.category,
        thumbnailUrl: templates.thumbnailUrl,
        previewUrl: templates.previewUrl,
        isDefault: templates.isDefault,
        isPremium: templates.isPremium,
        price: templates.price,
        sortOrder: templates.sortOrder,
        config: templateVersions.config,
        meta: templates.meta,
      })
      .from(templates)
      .innerJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
      .where(and(eq(templates.isActive, true), isNull(templates.deletedAt)))
      .orderBy(desc(templates.isDefault), asc(templates.sortOrder), asc(templates.createdAt));

    return rows.flatMap(({ config, meta: rawMeta, ...row }) => {
      const parsed = siteConfigSchema.safeParse(config);
      if (!parsed.success) return []; // A broken template version is never offered.
      const meta = resolveTemplateMeta(rawMeta, row.key);
      return [
        {
          ...row,
          palette: meta.palette,
          pages: templateOutline(parsed.data).map((page) => ({
            slug: page.slug,
            isHome: page.isHome,
            name: page.name,
            ...(meta.pageNames[page.slug] && { names: meta.pageNames[page.slug] }),
          })),
        },
      ];
    });
  },
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
  name: "marketing:template-preview:v2",
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
