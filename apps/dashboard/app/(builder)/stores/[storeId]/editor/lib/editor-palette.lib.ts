/**
 * Add panel data (P4B-03/07): the one section per group, and the
 * per-viewer "Recent" / "Most used" lists. Those lists are a convenience
 * kept in localStorage; every access is guarded so a blocked or empty
 * storage just shows nothing.
 */
import { SECTION_CATEGORIES, storeSectionRegistry, type AnySectionDefinition, type SectionCategory } from "@workspace/store-sections/render";

/** Add-panel groups → the one section each shows (stored `sectionId`s never change). */
export const SECTION_GROUPS = [
  { key: "header", sectionId: "store-header" },
  { key: "hero", sectionId: "hero-banner" },
  { key: "products", sectionId: "product-grid" },
  { key: "categories", sectionId: "category-grid" },
  { key: "features", sectionId: "features" },
  { key: "about", sectionId: "image-with-text" },
  { key: "content", sectionId: "rich-text" },
  { key: "cta", sectionId: "cta-banner" },
  { key: "faq", sectionId: "faq" },
  { key: "testimonials", sectionId: "testimonials" },
  { key: "logos", sectionId: "logo-cloud" },
  { key: "gallery", sectionId: "image-gallery" },
  { key: "blog", sectionId: "blog-latest-posts" },
  { key: "contact", sectionId: "contact-form" },
  { key: "footer", sectionId: "store-footer" },
  { key: "custom", sectionId: "custom-section" },
] as const;

export type SectionGroupKey = (typeof SECTION_GROUPS)[number]["key"];

export function sectionGroups(): { key: SectionGroupKey; definition: AnySectionDefinition }[] {
  return SECTION_GROUPS.flatMap(({ key, sectionId }) => {
    const definition = storeSectionRegistry.get(sectionId);
    return definition && definition.insertable !== false ? [{ key, definition }] : [];
  });
}

/** Palette item keys: `el:<type>`, `preset:<id>`, `section:<sectionId>`. */
export type PaletteKey = `el:${string}` | `preset:${string}` | `section:${string}`;

const RECENT_KEY = "tallaby.editor.recent";
const USAGE_KEY = "tallaby.editor.usage";
const MAX_RECENT = 6;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage blocked or full: the lists are optional.
  }
}

export function recordUse(item: PaletteKey) {
  const recent = read<string[]>(RECENT_KEY, []).filter((k) => k !== item);
  write(RECENT_KEY, [item, ...recent].slice(0, MAX_RECENT));
  const usage = read<Record<string, number>>(USAGE_KEY, {});
  write(USAGE_KEY, { ...usage, [item]: (usage[item] ?? 0) + 1 });
}

export function recentItems(): PaletteKey[] {
  const value = read<unknown>(RECENT_KEY, []);
  return Array.isArray(value) ? (value.filter((k) => typeof k === "string") as PaletteKey[]) : [];
}

export function mostUsedItems(limit = 4): PaletteKey[] {
  const usage = read<Record<string, number>>(USAGE_KEY, {});
  if (!usage || typeof usage !== "object") return [];
  return (Object.entries(usage) as [PaletteKey, number][])
    .filter(([, count]) => typeof count === "number" && count > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([key]) => key);
}

/** Case- and accent-insensitive match of a palette item against a search. */
export function matchesSearch(query: string, ...texts: string[]): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return texts.some((text) => text.toLowerCase().includes(q));
}

/** Every insertable section, by library category in the Add panel's order (P4B-06, like the reference layouts palette). */
export function sectionsByCategory(): { category: SectionCategory; sections: AnySectionDefinition[] }[] {
  const insertable = storeSectionRegistry.list().filter((d) => d.insertable !== false);
  return SECTION_CATEGORIES.map((category) => ({ category, sections: insertable.filter((d) => d.category === category) })).filter(
    (group) => group.sections.length > 0,
  );
}

/** Insert position for a drop at `y` (canvas drag and drop): before the first section whose middle is below it. */
export function dropIndex(sections: readonly { top: number; bottom: number }[], y: number): number {
  const index = sections.findIndex((s) => y < (s.top + s.bottom) / 2);
  return index === -1 ? sections.length : index;
}
