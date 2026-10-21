/**
 * Website › Templates (PLAN.md §8.1, P4-05): gallery rows → card views, with
 * section names resolved from the section library. Shared by the Templates
 * page and the editor's Templates tab. No React here.
 */
import type { StoreTemplateCard } from "@workspace/lib/store-sites/server";
import { getDesign, storeSectionRegistry } from "@workspace/store-sections/render";
import { getTemplateDesign } from "@workspace/store-sections/templates";
import { findIndustry } from "@/lib/stores/industries.lib";
import type { TemplateCardView } from "./templates.dto";

/** A section's name: its design (tree sections, `source`) or its registry entry. */
function sectionName(id: string) {
  const design = id.includes("@") ? id.split("@")[0]! : null;
  if (design) {
    const found = getDesign(design) ?? getTemplateDesign(design);
    if (found) return found.name;
  }
  return storeSectionRegistry.get(id)?.displayName ?? { ar: id, en: id };
}

/**
 * The store's industry templates first (owner request 2026-10-21): template
 * categories use the industry ids (`electronics`, `fashion`, …). Stable, so
 * each group keeps the gallery order (default first, then sort order).
 */
export function sortByIndustry<T extends { category: string }>(templates: T[], industryId: string | null | undefined): T[] {
  if (!industryId) return templates;
  return [...templates.filter((tpl) => tpl.category === industryId), ...templates.filter((tpl) => tpl.category !== industryId)];
}

export function toTemplateCardViews(
  templates: StoreTemplateCard[],
  storeCategory?: { en?: string | null; ar?: string | null },
): TemplateCardView[] {
  const industry = storeCategory ? findIndustry(storeCategory) : null;
  // Swatches, page names and form kinds come from the database row (templates.meta, current version).
  return sortByIndustry(templates, industry?.id).map((template) => {
    return {
      key: template.key,
      name: template.name,
      description: template.description,
      category: template.category,
      thumbnailUrl: template.thumbnailUrl,
      isDefault: template.isDefault,
      isPremium: template.isPremium,
      version: template.version,
      palette: template.palette,
      formKinds: template.formKinds,
      pageNames: template.pageNames,
      pages: template.outline.map((page) => ({
        slug: page.slug,
        isHome: page.isHome,
        name: page.name,
        sections: page.sections.map((id) => sectionName(id)),
      })),
    };
  });
}
