import { cache } from "react";
import { cacheProfiles, createCachedQuery, templateTags } from "@workspace/cache";
import { codeTemplateConfig, getPublicTemplate, offeredTemplates, templateEditionId } from "@workspace/lib/store-sites/server";
import { siteConfigSchema, type SiteConfig } from "@workspace/store-sections";
import {
  NICHES,
  editionOptions,
  editionsForNiche,
  isIndustrySwitched,
  isRetiredTemplate,
  nicheTemplateFirst,
  readyNicheTemplate,
  resolveTemplateMeta,
  templateMeta,
  templateOutline,
  type TemplateMeta,
} from "@workspace/store-sections/templates";
import { buildGallery, buildNicheTabs, type CatalogNiche, type CatalogTemplate, type GalleryEntry, type GalleryNicheTab } from "./templates.lib";

/**
 * The tallaby.com gallery: every code template (templates are code-only since
 * 2026-10-27; 0109 dropped the template tables) with a valid config. Cached
 * because each entry is built from a ~95 KB config; a deploy brings changes.
 */
const getCachedCatalog = createCachedQuery({
  name: "marketing:template-catalog:v5",
  ttl: cacheProfiles.taxonomy,
  // Templates and sections are code: a deploy brings new trees.
  perDeploy: true,
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
          editions: editionOptions(template.key),
          preview: template.preview ?? null,
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
  // A niche-only industry (ROADMAP F-90) leaves out its templates that serve no niche.
  return buildGallery(rows, locale, (row) => isRetiredTemplate(row));
});

/**
 * The gallery's niche tabs for a locale (niche editions, ROADMAP F-90): every
 * niche with an edition on a listed template, in the niche list's order, as
 * the dashboard gallery offers them. Code only, so nothing more to cache.
 */
export const getTemplateNicheTabs = cache(async (locale: string): Promise<GalleryNicheTab[]> => {
  const niches: CatalogNiche[] = NICHES.flatMap((niche): CatalogNiche[] => {
    // A niche-only industry (ROADMAP F-90): the niche's one template, with its edition (none when native).
    if (isIndustrySwitched(niche.industry)) {
      const row = readyNicheTemplate(niche.id);
      return row ? [{ id: niche.id, industry: niche.industry, name: niche.name, looks: [row.template], switched: true, edition: row.edition ?? null }] : [];
    }
    // Elsewhere the niche's looks, its own niche template first when it is ready.
    const looks = nicheTemplateFirst(niche.id, editionsForNiche(niche.id).map((entry) => entry.look));
    return looks.length ? [{ id: niche.id, industry: niche.industry, name: niche.name, looks }] : [];
  });
  return buildNicheTabs(niches, (await getTemplateGallery(locale)).map((entry) => entry.id), locale);
});

export async function findGalleryEntry(locale: string, id: string): Promise<GalleryEntry | null> {
  return (await getTemplateGallery(locale)).find((entry) => entry.id === id) ?? null;
}

const getCachedTemplatePreview = createCachedQuery({
  name: "marketing:template-preview:v4",
  ttl: cacheProfiles.taxonomy,
  // Templates and sections are code: a deploy brings new trees.
  perDeploy: true,
  // The niche edition (a checked niche id, or null) is an argument, so it is part of the cache key.
  tags: (_key: string, _edition: string | null) => [templateTags.catalog()],
  query: (key: string, edition: string | null) => getPublicTemplate(key, undefined, edition),
});

export type TemplatePreview = {
  config: SiteConfig;
  meta: TemplateMeta;
  /** The niche edition the config and demo store were built with, or null for the template's own content. */
  edition: string | null;
};

/**
 * An active template's current site config and meta (demo store, page names)
 * for the preview frame; null when unknown, deleted or unreachable.
 *
 * `editionId` (`?edition=<nicheId>`, niche editions, ROADMAP F-90) asks for
 * the look built with that niche's edition. It is a visitor's value, so it is
 * checked before anything is cached: an unknown niche, a pack not approved on
 * the template and a template that is not edition-ready all become `null`,
 * which is the template's own content and its usual cache entry. So the cache
 * holds at most one entry per template and one per real (template, edition)
 * pair, whatever a URL says. An edition that fails to build falls back to the
 * template's own content too (`edition` is then null).
 */
export const getTemplatePreview = cache(async (key: string, editionId?: string | null): Promise<TemplatePreview | null> => {
  try {
    const stored = await getCachedTemplatePreview(key, templateEditionId(key, editionId));
    // Re-parsed: the cache hands back plain JSON.
    const parsed = siteConfigSchema.safeParse(stored?.config);
    if (!stored || !parsed.success) return null;
    // With an edition, the demo store is the edition's; the code template's is only the fallback of a malformed one.
    return { config: parsed.data, meta: resolveTemplateMeta(stored.meta, key), edition: stored.edition ?? null };
  } catch (error) {
    console.error("[marketing] template config failed", error);
    return null;
  }
});
