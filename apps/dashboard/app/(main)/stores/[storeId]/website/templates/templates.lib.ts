/**
 * Website › Templates (PLAN.md §8.1, P4-05): gallery rows → card views, with
 * section names resolved from the section library. Shared by the Templates
 * page and the editor's Templates tab. No React here.
 */
import type { StoreTemplateCard } from "@workspace/lib/store-sites/server";
import { storeSectionRegistry } from "@workspace/store-sections/render";
import type { TemplateCardView } from "./templates.dto";

export function toTemplateCardViews(templates: StoreTemplateCard[]): TemplateCardView[] {
  return templates.map((template) => ({
    key: template.key,
    name: template.name,
    description: template.description,
    category: template.category,
    thumbnailUrl: template.thumbnailUrl,
    isDefault: template.isDefault,
    isPremium: template.isPremium,
    version: template.version,
    pages: template.outline.map((page) => ({
      slug: page.slug,
      isHome: page.isHome,
      name: page.name,
      sections: page.sections.map((id) => storeSectionRegistry.get(id)?.displayName ?? { ar: id, en: id }),
    })),
  }));
}
