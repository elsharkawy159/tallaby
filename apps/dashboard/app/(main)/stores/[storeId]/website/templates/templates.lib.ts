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
 * Industries whose templates suit a store of another industry, nearest first
 * (owner request 2026-10-27): after its own category, a store sees these.
 */
const RELATED_INDUSTRIES: Record<string, readonly string[]> = {
  fashion: ["shoes-bags", "jewelry", "beauty", "handmade"],
  "shoes-bags": ["fashion", "jewelry", "sports"],
  jewelry: ["fashion", "handmade", "beauty", "shoes-bags"],
  beauty: ["health", "fashion", "jewelry", "handmade"],
  health: ["beauty", "food", "sports"],
  electronics: ["mobile-accessories", "kitchen", "auto"],
  "mobile-accessories": ["electronics", "auto"],
  home: ["kitchen", "handmade", "kids"],
  kitchen: ["home", "food", "electronics"],
  food: ["sweets", "kitchen", "health"],
  sweets: ["food", "handmade", "kitchen"],
  kids: ["books", "home", "sports", "fashion"],
  books: ["kids", "handmade"],
  sports: ["health", "fashion", "shoes-bags"],
  auto: ["electronics", "mobile-accessories", "sports"],
  pets: ["home", "food", "kids"],
  handmade: ["home", "jewelry", "fashion", "sweets"],
};

/** The order of template categories for a store: its industry, related industries, then the rest in gallery order. */
export function categoryOrder(categories: readonly string[], industryId: string | null | undefined): string[] {
  const unique = [...new Set(categories)];
  if (!industryId) return unique;
  const first = [industryId, ...(RELATED_INDUSTRIES[industryId] ?? [])].filter((id) => unique.includes(id));
  return [...first, ...unique.filter((id) => !first.includes(id))];
}

/** A 32-bit hash of a string (FNV-1a), the shuffle seed. */
function hashSeed(value: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/** Fisher-Yates with a seeded PRNG (mulberry32): the same seed gives the same order. */
function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  let state = hashSeed(seed);
  const random = () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}

/**
 * The gallery order for one store (owner requests 2026-10-21 and 2026-10-27):
 * categories by the store's industry (`categoryOrder`), and the templates of
 * each category shuffled with a seed. Sellers mostly pick the first template,
 * so a per-store order keeps stores from looking alike; the seed (the store
 * id) keeps the order the same on every visit and across pages. Without a
 * seed each category keeps the gallery order.
 */
export function sortByIndustry<T extends { category: string }>(templates: T[], industryId: string | null | undefined, seed?: string): T[] {
  const order = categoryOrder(
    templates.map((tpl) => tpl.category),
    industryId,
  );
  if (!seed) {
    // Matching categories first, everything else in gallery order (default first).
    const lead = order.filter((id) => id === industryId || RELATED_INDUSTRIES[industryId ?? ""]?.includes(id));
    return [...lead.flatMap((id) => templates.filter((tpl) => tpl.category === id)), ...templates.filter((tpl) => !lead.includes(tpl.category))];
  }
  return order.flatMap((category) =>
    seededShuffle(
      templates.filter((tpl) => tpl.category === category),
      `${seed}:${category}`,
    ),
  );
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
  seed?: string,
): TemplateCardView[] {
  const industry = storeCategory ? findIndustry(storeCategory) : null;
  return sortByIndustry(templates, industry?.id, seed).map(toTemplateCardView);
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
  { page, category, industryId, seed, pageSize = TEMPLATES_PAGE_SIZE }: { page: number; category: string; industryId?: string | null; seed?: string; pageSize?: number },
): { items: T[]; page: number; pageCount: number; total: number; categories: string[] } {
  const sorted = sortByIndustry(templates, industryId, seed);
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
