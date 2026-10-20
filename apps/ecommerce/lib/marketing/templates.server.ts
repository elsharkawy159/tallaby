import { cache } from "react";
import { cacheProfiles, createCachedQuery, templateTags } from "@workspace/cache";
import { asc, db, desc, eq, templateVersions, templates } from "@workspace/db";
import { getPublicTemplateConfig } from "@workspace/lib/store-sites/server";
import { siteConfigSchema, type SiteConfig } from "@workspace/store-sections";
import { getCodeTemplate, templateOutline } from "@workspace/store-sections/templates";
import { buildGallery, type CatalogTemplate, type GalleryEntry } from "./templates.lib";

/**
 * Active templates for the tallaby.com gallery, with a valid current version
 * only (the dashboard gallery hides the others too). Admin template edits
 * purge `templateTags.catalog()` (invalidateTemplateCatalog), so the gallery
 * and the preview frames follow without a deploy.
 */
const getCachedCatalog = createCachedQuery({
  name: "marketing:template-catalog:v2",
  ttl: cacheProfiles.listing,
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
      })
      .from(templates)
      .innerJoin(templateVersions, eq(templateVersions.id, templates.currentVersionId))
      .where(eq(templates.isActive, true))
      .orderBy(desc(templates.isDefault), asc(templates.sortOrder), asc(templates.createdAt));

    return rows.flatMap(({ config, ...row }) => {
      const parsed = siteConfigSchema.safeParse(config);
      if (!parsed.success) return []; // A broken template version is never offered.
      const code = getCodeTemplate(row.key);
      return [
        {
          ...row,
          palette: code?.palette ?? [],
          pages: templateOutline(parsed.data).map((page) => ({
            slug: page.slug,
            isHome: page.isHome,
            name: page.name,
            ...(code?.pageNames[page.slug] && { names: code.pageNames[page.slug] }),
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

const getCachedTemplateConfig = createCachedQuery({
  name: "marketing:template-config:v1",
  ttl: cacheProfiles.listing,
  tags: (_key: string) => [templateTags.catalog()],
  query: (key: string) => getPublicTemplateConfig(key),
});

/** An active template's current site config for the preview frame; null when unknown or unreachable. */
export const getTemplateConfig = cache(async (key: string): Promise<SiteConfig | null> => {
  try {
    const config = await getCachedTemplateConfig(key);
    // Re-parsed: the cache hands back plain JSON.
    const parsed = siteConfigSchema.safeParse(config);
    return parsed.success ? parsed.data : null;
  } catch (error) {
    console.error("[marketing] template config failed", error);
    return null;
  }
});
