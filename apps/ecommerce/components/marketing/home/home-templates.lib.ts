import type { GalleryEntry } from "@/lib/marketing/templates.lib";

/** How many templates the home page shows before its "See more templates" button (owner, 2026-11-16: 6, so the 3- and 2-column grids fill whole rows). */
export const HOME_TEMPLATE_COUNT = 6;

/**
 * The home page's templates: one per category first, in the catalog's order,
 * then the next templates in catalog order until there are `count`, so the
 * grid is always full when the catalog has enough templates.
 */
export function pickHomeTemplates(entries: readonly GalleryEntry[], count: number = HOME_TEMPLATE_COUNT): GalleryEntry[] {
  const seen = new Set<string>();
  const firsts = entries.filter((entry) => {
    if (seen.has(entry.category)) return false;
    seen.add(entry.category);
    return true;
  });
  const picked = firsts.slice(0, count);
  if (picked.length < count) {
    const ids = new Set(picked.map((entry) => entry.id));
    picked.push(...entries.filter((entry) => !ids.has(entry.id)).slice(0, count - picked.length));
  }
  return picked;
}
