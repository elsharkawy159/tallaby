import { flattenCategoryTree } from "./add-product.lib";
import { fallbackTallabyCategoryId, indexTallabyCategories, matchTallabyCategoryId } from "./category-search.lib";
import type { CategoryOption } from "./add-product.schema";

/**
 * The form's Tallaby category after the product type changed (F-108e):
 * `undefined` keeps it (empty, unknown, or already of the product's kind),
 * `null` clears it (a Tallaby category of the other kind the seller picked),
 * or the id to use behind a store category (matched again in the new kind's
 * tree, else its catch-all).
 */
export function categoryAfterKindChange({
  categoryId,
  allIds,
  kindTree,
  storeCategoryName,
  titles,
  locale,
}: {
  categoryId: string | undefined;
  /** Every Tallaby category id, of both kinds. */
  allIds: ReadonlySet<string>;
  /** The tree of the product's type only. */
  kindTree: CategoryOption[];
  /** The store (or new) category's own name, when the seller picked one. */
  storeCategoryName: string | null;
  titles: (string | undefined)[];
  locale: string;
}): string | null | undefined {
  if (!categoryId || !allIds.has(categoryId)) return undefined;
  if (flattenCategoryTree(kindTree).some((entry) => entry.category.id === categoryId)) return undefined;
  if (!storeCategoryName) return null;
  return (
    matchTallabyCategoryId(kindTree, storeCategoryName, titles) ??
    fallbackTallabyCategoryId(indexTallabyCategories(kindTree, locale)) ??
    null
  );
}
