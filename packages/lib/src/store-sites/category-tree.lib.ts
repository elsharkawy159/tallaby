/**
 * Two-level store categories (ROADMAP.md F-95, 0171): a main category
 * (`parentId` null) holds sub-categories. Pure helpers shared by the
 * dashboard, the storefront and every category-scoped rule, so they all agree
 * on the order and on what "this category" covers.
 */

/** Main category › sub-category. The database trigger enforces it too. */
export const MAX_CATEGORY_DEPTH = 2;

export type CategoryTreeItem = { id: string; parentId: string | null; position: number };

/** Ids of the items that are main categories in this list (no parent, or a parent that isn't a main one here). */
function mainIds<T extends CategoryTreeItem>(items: T[]): Set<string> {
  const byId = new Map(items.map((item) => [item.id, item]));
  const mains = new Set<string>();
  for (const item of items) {
    const parent = item.parentId ? byId.get(item.parentId) : undefined;
    // A child whose parent is missing (or, against the rules, is itself a child) shows as a main category.
    if (!parent || parent.id === item.id || parent.parentId != null) mains.add(item.id);
  }
  return mains;
}

/**
 * The list in tree order: main categories by position, each followed by its
 * sub-categories by position. Ties keep the input order (sort is stable), so
 * pass items ordered by (position, created_at) as the database reads them.
 * With no parents this is just the position order.
 */
export function flattenCategoryTree<T extends CategoryTreeItem>(items: T[]): T[] {
  const mains = mainIds(items);
  const byPosition = (a: T, b: T) => a.position - b.position;
  const children = new Map<string, T[]>();
  for (const item of items) {
    if (mains.has(item.id)) continue;
    const list = children.get(item.parentId!) ?? [];
    list.push(item);
    children.set(item.parentId!, list);
  }
  const out: T[] = [];
  for (const main of items.filter((item) => mains.has(item.id)).sort(byPosition)) {
    out.push(main);
    out.push(...(children.get(main.id) ?? []).sort(byPosition));
  }
  return out;
}

/** The category and its sub-categories (tree order): what a category scope covers. Unknown id → `[id]`. */
export function categoryWithChildren(id: string, items: CategoryTreeItem[]): string[] {
  const mains = mainIds(items);
  if (!mains.has(id)) return [id];
  const childIds = flattenCategoryTree(items)
    .filter((item) => item.parentId === id && !mains.has(item.id))
    .map((item) => item.id);
  return [id, ...childIds];
}

/** The category, then its main category when it is a sub-category: `[id]` or `[id, parentId]`. */
export function categoryParentChain(id: string, items: CategoryTreeItem[]): string[] {
  const mains = mainIds(items);
  const item = items.find((i) => i.id === id);
  if (!item || mains.has(id) || !item.parentId) return [id];
  return [id, item.parentId];
}
