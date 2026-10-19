import { cache } from "react";
import { cacheProfiles, createCachedQuery, templateTags } from "@workspace/cache";
import { asc, db, eq, templates } from "@workspace/db";
import { GALLERY_TEMPLATES } from "./templates.data";
import { buildGallery, type CatalogTemplate, type GalleryEntry } from "./templates.lib";

/**
 * Active templates for the tallaby.com gallery. Admin template edits purge
 * `templateTags.catalog()` (invalidateTemplateCatalog), so the gallery follows
 * without a deploy.
 */
const getCachedCatalog = createCachedQuery({
  name: "marketing:template-catalog:v1",
  ttl: cacheProfiles.listing,
  tags: () => [templateTags.catalog()],
  query: (): Promise<CatalogTemplate[]> =>
    db
      .select({
        key: templates.key,
        name: templates.name,
        description: templates.description,
        category: templates.category,
        thumbnailUrl: templates.thumbnailUrl,
        previewUrl: templates.previewUrl,
        isPremium: templates.isPremium,
        price: templates.price,
        sortOrder: templates.sortOrder,
      })
      .from(templates)
      .where(eq(templates.isActive, true))
      .orderBy(asc(templates.sortOrder)),
});

/** The gallery for a locale. If the database is unreachable, every preview shows as "soon" rather than failing the page. */
export const getTemplateGallery = cache(async (locale: string): Promise<GalleryEntry[]> => {
  let rows: CatalogTemplate[] = [];
  try {
    rows = await getCachedCatalog();
  } catch (error) {
    console.error("[marketing] template catalog failed", error);
  }
  return buildGallery(GALLERY_TEMPLATES, rows, locale);
});

export async function findGalleryEntry(locale: string, id: string): Promise<GalleryEntry | null> {
  return (await getTemplateGallery(locale)).find((entry) => entry.id === id) ?? null;
}
