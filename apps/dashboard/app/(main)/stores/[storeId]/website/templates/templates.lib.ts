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

/** One gallery row → its card view (section names resolved from the library). */
export function toTemplateCardView(template: StoreTemplateCard): TemplateCardView {
  // Swatches, page names and form kinds come from the database row (templates.meta, current version).
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
}

export function toTemplateCardViews(
  templates: StoreTemplateCard[],
  storeCategory?: { en?: string | null; ar?: string | null },
): TemplateCardView[] {
  const industry = storeCategory ? findIndustry(storeCategory) : null;
  return sortByIndustry(templates, industry?.id).map(toTemplateCardView);
}

/** Cards per gallery page: fills whole rows of the 2, 3 and 4-column grids. */
export const TEMPLATES_PAGE_SIZE = 12;

/** `?page=` → a 1-based page number (anything else is page 1). */
export function parseTemplatesPage(value: unknown): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/** `?category=` → a category id, or `all`. */
export function parseTemplatesCategory(value: unknown): string {
  return typeof value === "string" && /^[a-z0-9_-]{1,64}$/i.test(value) ? value : "all";
}

/**
 * One page of the gallery (owner request 2026-10-24): the store's industry
 * first, then the category filter, then the page. The page is clamped to the
 * last one, since a template change can shrink the list. `categories` lists
 * every category of the whole gallery, in gallery order (for the tabs).
 */
export function pageTemplates<T extends { category: string }>(
  templates: T[],
  { page, category, industryId, pageSize = TEMPLATES_PAGE_SIZE }: { page: number; category: string; industryId?: string | null; pageSize?: number },
): { items: T[]; page: number; pageCount: number; total: number; categories: string[] } {
  const sorted = sortByIndustry(templates, industryId);
  const categories = [...new Set(sorted.map((tpl) => tpl.category))];
  const filtered = category === "all" ? sorted : sorted.filter((tpl) => tpl.category === category);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    items: filtered.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageCount,
    total: filtered.length,
    categories,
  };
}
