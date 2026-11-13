import { flattenCategoryTree } from "@workspace/lib/store-sites/category-tree";

export type LabelledCategoryRow = { id: string; name: string; nameAr: string | null; parentId: string | null; position: number };

/**
 * A store's categories for a picker (0171): tree order (each main category,
 * then its sub-categories), a sub-category labelled "Main › Sub" in the shown
 * language. Pass the rows ordered by position, as the database reads them.
 */
export function labelStoreCategories(rows: LabelledCategoryRow[], locale: string): Array<{ id: string; name: string }> {
  const own = (row: LabelledCategoryRow) => (locale === "ar" ? row.nameAr : row.name) || row.name || row.nameAr || "";
  const byId = new Map(rows.map((row) => [row.id, row]));
  return flattenCategoryTree(rows).map((row) => {
    const parent = row.parentId ? byId.get(row.parentId) : undefined;
    // A parent that is itself a sub-category (never valid) shows the row as a main one, like the tree does.
    return { id: row.id, name: parent && !parent.parentId && parent.id !== row.id ? `${own(parent)} › ${own(row)}` : own(row) };
  });
}
