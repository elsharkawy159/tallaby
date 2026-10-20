/**
 * Website › Templates (PLAN.md §8.1, P4-05): gallery rows → card views, with
 * section names resolved from the section library. Shared by the Templates
 * page and the editor's Templates tab. No React here. Copied from the
 * dashboard (apps/dashboard/app/(main)/stores/[storeId]/website/templates).
 */
import type { StoreTemplateCard } from "@workspace/lib/store-sites/server";
import { getDesign, storeSectionRegistry } from "@workspace/store-sections/render";
import { getTemplateDesign } from "@workspace/store-sections/templates";
import type { TemplateCardView } from "@workspace/store-editor/templates.dto";

/** A section's name: its design (tree sections, `source`) or its registry entry. */
function sectionName(id: string) {
  const design = id.includes("@") ? id.split("@")[0]! : null;
  if (design) {
    const found = getDesign(design) ?? getTemplateDesign(design);
    if (found) return found.name;
  }
  return storeSectionRegistry.get(id)?.displayName ?? { ar: id, en: id };
}

export function toTemplateCardViews(templates: StoreTemplateCard[]): TemplateCardView[] {
  // Swatches, page names and form kinds come from the database row (templates.meta, current version).
  return templates.map((template) => {
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
