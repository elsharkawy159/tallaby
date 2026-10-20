/**
 * The published section library (`library_sections`, 0086; Task 10): what
 * Add › Sections lists in the seller and admin editors. Platform data with no
 * seller data in it, so the editor pages cache it under
 * `librarySectionTags.catalog()`; admin library writes invalidate that tag.
 * Drafts (`draft_tree`) are never read here.
 */
import { and, asc, db, eq, isNull, librarySections } from "@workspace/db";
import type { SectionPreset } from "@workspace/store-sections/render";
import { toLibraryPreset, type LibrarySectionRow } from "./library-sections.lib";

export { toLibraryPreset, type LibrarySectionRow } from "./library-sections.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

/** Published rows: not deleted, not hidden, in `sort_order` (then key, for a stable order). */
export async function listPublishedLibrarySections(q: Queryable = db): Promise<LibrarySectionRow[]> {
  return q
    .select({
      key: librarySections.key,
      category: librarySections.category,
      subcategory: librarySections.subcategory,
      name: librarySections.name,
      description: librarySections.description,
      keywords: librarySections.keywords,
      tree: librarySections.tree,
      version: librarySections.version,
    })
    .from(librarySections)
    .where(and(isNull(librarySections.deletedAt), eq(librarySections.isHidden, false)))
    .orderBy(asc(librarySections.sortOrder), asc(librarySections.key));
}

/** The editor presets of the published rows; rows the editor cannot use are left out. */
export async function listLibraryPresets(q: Queryable = db): Promise<SectionPreset[]> {
  const rows = await listPublishedLibrarySections(q);
  return rows.map(toLibraryPreset).filter((preset): preset is SectionPreset => preset !== null);
}
