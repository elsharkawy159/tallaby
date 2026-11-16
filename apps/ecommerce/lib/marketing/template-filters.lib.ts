import { TEMPLATE_CATEGORIES, type TemplateCategory } from "./templates.data";
import { galleryCards, type GalleryCard, type GalleryNicheTab } from "./templates.lib";

/**
 * The /templates filter sidebar (2026-11-16, in the style of themes.shopify.com):
 * industries (category codes, several at once), one niche (trade) and a sort.
 * The state lives in the URL so a filtered gallery can be shared:
 *
 *   ?industry=fa,be&niche=<nicheId>&sort=newest
 *
 * Older links keep working: `?category=<code>` reads as one industry and
 * `?category=<code>&niche=<id>` as that niche. Writing drops `category`.
 * A niche stays single-select because a niche card is drawn and linked with
 * that niche's edition (galleryCards), which a template can only show once.
 */

export type IndustryCode = Exclude<TemplateCategory, "all">;
export const GALLERY_SORTS = ["featured", "newest", "name"] as const;
export type GallerySort = (typeof GALLERY_SORTS)[number];

export type GalleryFilters = { industries: IndustryCode[]; niche: string | null; sort: GallerySort };

export const EMPTY_FILTERS: GalleryFilters = { industries: [], niche: null, sort: "featured" };

const CATEGORY_ORDER = TEMPLATE_CATEGORIES.filter((code): code is IndustryCode => code !== "all");

function isIndustry(value: string): value is IndustryCode {
  return (CATEGORY_ORDER as readonly string[]).includes(value);
}

/** Valid codes only, once each, in the gallery's category order. */
function normalizeIndustries(values: Iterable<string>): IndustryCode[] {
  const wanted = new Set([...values].map((value) => value.trim()).filter(isIndustry));
  return CATEGORY_ORDER.filter((code) => wanted.has(code));
}

/** The filters a URL asks for. Unknown industries, niches and sorts are dropped. */
export function parseGalleryFilters(search: string | URLSearchParams, tabs: readonly Pick<GalleryNicheTab, "id" | "category">[]): GalleryFilters {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const industries = normalizeIndustries([...(params.get("industry")?.split(",") ?? []), ...(params.get("category") ? [params.get("category") as string] : [])]);
  const nicheId = params.get("niche");
  // A niche only counts when it belongs to an asked industry (or none was asked); it then pins its industry.
  const tab = nicheId ? tabs.find((entry) => entry.id === nicheId && (!industries.length || industries.includes(entry.category))) : undefined;
  const sortValue = params.get("sort");
  const sort = (GALLERY_SORTS as readonly string[]).includes(sortValue ?? "") ? (sortValue as GallerySort) : "featured";
  return tab ? { industries: [tab.category], niche: tab.id, sort } : { industries, niche: null, sort };
}

/** `current` with the filters written in (other params are kept); `category` is replaced by `industry`. */
export function writeGalleryFilters(filters: GalleryFilters, current: string | URLSearchParams = ""): URLSearchParams {
  const params = new URLSearchParams(current);
  for (const key of ["category", "industry", "niche", "sort"]) params.delete(key);
  if (filters.industries.length) params.set("industry", filters.industries.join(","));
  if (filters.niche) params.set("niche", filters.niche);
  if (filters.sort !== "featured") params.set("sort", filters.sort);
  return params;
}

export function hasActiveFilters(filters: GalleryFilters): boolean {
  return filters.industries.length > 0 || filters.niche !== null;
}

/** Adds or removes an industry; a picked niche is cleared. */
export function toggleIndustry(filters: GalleryFilters, code: IndustryCode): GalleryFilters {
  const industries = filters.industries.includes(code) ? filters.industries.filter((value) => value !== code) : [...filters.industries, code];
  return { ...filters, industries: normalizeIndustries(industries), niche: null };
}

/** Picks a niche (it narrows the industries to its own) or clears it (null). */
export function pickNiche(filters: GalleryFilters, tab: Pick<GalleryNicheTab, "id" | "category"> | null): GalleryFilters {
  return tab ? { ...filters, industries: [tab.category], niche: tab.id } : { ...filters, niche: null };
}

/**
 * The cards the filters list, in order. A niche: that niche's cards (its
 * edition). Industries: each industry's cards as its old category tab listed
 * them, in category order. Nothing: every entry. Then the sort: "featured"
 * keeps that order, "newest" puts a higher sortOrder first, "name" is A to Z.
 */
export function filterGalleryCards<T extends { id: string; category: string; name: string; sortOrder: number }>(
  entries: readonly T[],
  tabs: readonly GalleryNicheTab[],
  filters: GalleryFilters,
  locale: string,
): GalleryCard<T>[] {
  const niche = filters.niche ? tabs.find((tab) => tab.id === filters.niche) : undefined;
  let cards: GalleryCard<T>[];
  if (niche) cards = galleryCards(entries, tabs, niche.category, niche.id);
  else if (!filters.industries.length) cards = galleryCards(entries, tabs, "all", null);
  else {
    const seen = new Set<string>();
    cards = filters.industries
      .flatMap((code) => galleryCards(entries, tabs, code, null))
      .filter((card) => {
        if (seen.has(card.entry.id)) return false;
        seen.add(card.entry.id);
        return true;
      });
  }
  if (filters.sort === "newest") return cards.map((card, index) => ({ card, index })).sort((a, b) => b.card.entry.sortOrder - a.card.entry.sortOrder || a.index - b.index).map(({ card }) => card);
  if (filters.sort === "name") {
    const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
    return cards.map((card, index) => ({ card, index })).sort((a, b) => collator.compare(a.card.entry.name, b.card.entry.name) || a.index - b.index).map(({ card }) => card);
  }
  return cards;
}

export type IndustryOption = { code: IndustryCode; count: number };

/** Every industry with at least one card, in category order, with its card count. */
export function industryOptions<T extends { id: string; category: string }>(entries: readonly T[], tabs: readonly GalleryNicheTab[]): IndustryOption[] {
  return CATEGORY_ORDER.map((code) => ({ code, count: galleryCards(entries, tabs, code, null).length })).filter((option) => option.count > 0);
}

export type NicheOption = { id: string; name: string; category: IndustryCode; count: number };

/** The niches of the picked industries (all niches when none is picked), in niche order, with their card counts. */
export function nicheOptions(tabs: readonly GalleryNicheTab[], industries: readonly IndustryCode[]): NicheOption[] {
  return tabs
    .filter((tab) => !industries.length || industries.includes(tab.category))
    .map((tab) => ({ id: tab.id, name: tab.name, category: tab.category, count: tab.looks.length }))
    .filter((option) => option.count > 0);
}
