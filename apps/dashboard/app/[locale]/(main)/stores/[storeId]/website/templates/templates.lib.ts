/**
 * Website › Templates (PLAN.md §8.1, P4-05): gallery rows → card views, with
 * section names resolved from the section library. Shared by the Templates
 * page and the editor's Templates tab. No React here.
 */
import type { StoreTemplateCard } from "@workspace/lib/store-sites/server";
import { templatePreviewOrigin } from "@workspace/lib/storefront/platform-hosts";
import { getDesign, storeSectionRegistry } from "@workspace/store-sections/render";
import { SWITCHED_INDUSTRIES, getTemplateDesign, isRetiredTemplate, type NicheOption } from "@workspace/store-sections/templates";
import { sortByRelevance, type TemplateRelevance } from "@workspace/store-editor/lib/template-relevance.lib";
import { RELATED_INDUSTRIES } from "@/lib/stores/industries.lib";
import { templatePreviewSrc } from "@/app/[locale]/(builder)/ai-builder/_components/workspace.lib";
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

/** The order of template categories for a store: its industry, related industries, then the rest in gallery order. */
export function categoryOrder(categories: readonly string[], industryId: string | null | undefined): string[] {
  const unique = [...new Set(categories)];
  if (!industryId) return unique;
  const first = [industryId, ...(RELATED_INDUSTRIES[industryId] ?? [])].filter((id) => unique.includes(id));
  return [...first, ...unique.filter((id) => !first.includes(id))];
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
    editions: template.editions ?? [],
    preview: template.preview ?? null,
    pages: template.outline.map((page) => ({
      slug: page.slug,
      isHome: page.isHome,
      name: page.name,
      sections: page.sections.map((id) => sectionName(id)),
    })),
  };
}

/** Gallery rows → card views, most relevant first (`sortRelevantNewest`; owner, 2026-11-15). */
export function toTemplateCardViews(templates: StoreTemplateCard[], relevance: TemplateRelevance = {}): TemplateCardView[] {
  return sortRelevantNewest(templates, relevance).map(toTemplateCardView);
}

/** Cards per gallery page: fills whole rows of the 2, 3 and 4-column grids. */
export const TEMPLATES_PAGE_SIZE = 12;

/** `?page=` → a 1-based page number (anything else is page 1). */
export function parseTemplatesPage(value: unknown): number {
  const page = Number(value);
  return Number.isSafeInteger(page) && page >= 1 ? page : 1;
}

/** Does a gallery search match this template? Name and description, either language. */
export function matchesTemplateSearch(template: { name: { ar?: string; en?: string }; description?: { ar?: string; en?: string } | null }, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const { name, description } = template;
  return [name.ar, name.en, description?.ar, description?.en].some((text) => text?.toLowerCase().includes(needle));
}

/** `?category=` → a category id, or `all`. */
export function parseTemplatesCategory(value: unknown): string {
  return typeof value === "string" && /^[a-z0-9_-]{1,64}$/i.test(value) ? value : "all";
}

/** `?niche=` → a niche id, or `all`. */
export function parseTemplatesNiche(value: unknown): string {
  return typeof value === "string" && /^[a-z0-9][a-z0-9-]{0,62}$/.test(value) ? value : "all";
}

/**
 * The niche filter of a category tab (niche editions, ROADMAP F-90).
 * `offered` is the tab's niches that have an edition (`offeredNiches`; none
 * for "All" and during a search). Only a niche the seller asked for filters:
 * no niche asked for (`null`), `all`, an unknown id and a niche the tab does
 * not offer are no filter (owner, 2026-11-15: never preselect a niche that
 * hides other templates; the store's niche orders the list instead).
 */
export function resolveNicheFilter(offered: readonly NicheOption[], requested: string | null | undefined): string | null {
  if (!offered.length || requested == null) return null;
  return offered.some((niche) => niche.id === requested) ? requested : null;
}

/** The category tab served: the one asked for, else `all` (owner, 2026-11-15: the gallery opens on All, most relevant first). */
export function servedCategory(requested: string | null): string {
  return requested ?? "all";
}

/** Newest first (owner request 2026-10-28): a higher `sortOrder` is a newer template; ties keep their order. */
export function sortNewest<T extends { sortOrder?: number }>(templates: T[]): T[] {
  return [...templates].sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));
}

/**
 * Most relevant first (owner requests 2026-10-28 and 2026-11-15:
 * `sortByRelevance`, the store niche's template, then its industry, its
 * related industries in their order, then the rest), and the newest first
 * inside each of those groups.
 */
export function sortRelevantNewest<T extends { key: string; category: string; sortOrder?: number }>(templates: readonly T[], relevance: TemplateRelevance = {}): T[] {
  return sortByRelevance(sortNewest([...templates]), relevance);
}

/**
 * One page of the gallery (owner request 2026-10-24): the category filter,
 * then the page. Every tab is most relevant first (`sortByRelevance` with
 * the store's industry and niche; owner request 2026-11-15), newest first
 * inside a group. The page is clamped to the last one, since a template
 * change can shrink the list. `categories` lists every category of the whole
 * gallery, the store's industry and its related ones first (for the tabs).
 * With no category asked for (`null`) the tab is `all` (owner, 2026-11-15);
 * `category` is the tab served. A niche tab filters like a category tab
 * (owner request 2026-11-11): with `nicheLooks` (a chosen niche's looks,
 * best first) a category tab lists only those looks, in that order,
 * whatever their own category; "All" ignores them. `tabLooks` (a switched
 * industry's niche templates, in niche order; ROADMAP F-90) replaces a
 * category tab's own list the same way, then is sorted by relevance.
 */
export function pageTemplates<T extends { category: string; sortOrder?: number; key: string }>(
  templates: T[],
  {
    page,
    category: requested,
    industryId,
    nicheId,
    pageSize = TEMPLATES_PAGE_SIZE,
    nicheLooks = [],
    tabLooks = null,
  }: { page: number; category: string | null; industryId?: string | null; nicheId?: string | null; pageSize?: number; nicheLooks?: readonly string[]; tabLooks?: readonly string[] | null },
): { items: T[]; page: number; pageCount: number; total: number; categories: string[]; category: string } {
  const relevance = { industryId, nicheId };
  // The tabs keep the store's industry and its related ones first.
  const categories = categoryOrder(
    templates.map((tpl) => tpl.category),
    industryId,
  );
  const category = servedCategory(requested);
  const byKeys = (keys: readonly string[]) => [...new Set(keys)].flatMap((key) => templates.filter((tpl) => tpl.key === key));
  const inTab =
    category === "all"
      ? sortRelevantNewest(templates, relevance)
      : tabLooks
        ? sortByRelevance(byKeys(tabLooks), relevance)
        : sortRelevantNewest(
            templates.filter((tpl) => tpl.category === category),
            relevance,
          );
  const byNiche = category !== "all" && nicheLooks.length > 0;
  const filtered = byNiche ? byKeys(nicheLooks) : inTab;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(Math.max(1, page), pageCount);
  return {
    items: filtered.slice((current - 1) * pageSize, current * pageSize),
    page: current,
    pageCount,
    total: filtered.length,
    categories,
    category,
  };
}

// ── One template per niche (ROADMAP F-90, docs/systems/one-template-per-niche.md §1) ──
// `switched` is a parameter only so tests can pass a set; callers leave it out.

// galleryNiches, nicheCards and cardEdition live in @workspace/store-editor (shared with Admin's change-theme dialog).
export { cardEdition, galleryNiches, nicheCards } from "@workspace/store-editor/lib/template-niches.lib";

/** The gallery without the templates a niche-only industry leaves out (none until an industry switches). */
export function galleryTemplates<T extends { key: string; category: string }>(templates: readonly T[], switched: ReadonlySet<string> = SWITCHED_INDUSTRIES): T[] {
  return templates.filter((tpl) => !isRetiredTemplate(tpl, switched));
}

/** preview.tallaby.com, where the full-page template preview (`/template-preview/<key>`) and the card screenshots (`/template-previews/*`) live. */
export const TEMPLATE_PREVIEW_ORIGIN = templatePreviewOrigin();

/**
 * The preview dialog's "Preview" link (owner request 2026-11-11): the same
 * full-page storefront preview the AI builder frames (`templatePreviewSrc`),
 * in the dialog's language, with the niche edition shown and the page open in
 * the dialog (none for the home page). The route checks the edition itself.
 */
export function templatePreviewTabUrl(origin: string, locale: string, key: string, page: { slug: string; isHome: boolean } | null | undefined, edition: string | null): string {
  const url = new URL(templatePreviewSrc(origin, locale, key, false, edition));
  if (page && !page.isHome && page.slug) url.pathname += `/${encodeURIComponent(page.slug)}`;
  return url.toString();
}
