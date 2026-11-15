import type { TaxonomyKind } from "./categories-brands.dto";

/** Tidy a name before saving: trim and collapse inner whitespace. */
export function cleanTaxonomyName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

/** The key the DB keeps unique per seller (lower(btrim(name))), applied to a cleaned name. */
export function taxonomyNameKey(name: string): string {
  return cleanTaxonomyName(name).toLowerCase();
}

/** The label to show: Arabic when the UI is Arabic and one exists. */
export function taxonomyLabel(item: { name: string; nameAr: string | null }, locale: string): string {
  return locale === "ar" && item.nameAr?.trim() ? item.nameAr : item.name;
}

/** Escape `%`, `_` and `\` so a search term is matched literally by ILIKE. */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (c) => `\\${c}`);
}

/** Postgres unique violation, also when wrapped by the driver or Drizzle. */
export function isUniqueViolation(error: unknown): boolean {
  for (let e = error, depth = 0; e && typeof e === "object" && depth < 4; depth++) {
    if ((e as { code?: unknown }).code === "23505") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

/**
 * Take the seller's own category / brand off the product form values. They
 * are saved by setProductSellerTaxonomy, never through createProduct /
 * updateProduct (which write form keys straight to the row). "" means none.
 */
export function splitSellerTaxonomy<T extends { sellerCategoryId?: string; sellerBrandId?: string }>(
  data: T,
): { rest: Omit<T, "sellerCategoryId" | "sellerBrandId">; taxonomy: { sellerCategoryId: string | null; sellerBrandId: string | null } } {
  const { sellerCategoryId, sellerBrandId, ...rest } = data;
  return { rest, taxonomy: { sellerCategoryId: sellerCategoryId || null, sellerBrandId: sellerBrandId || null } };
}

/** Storage bucket that holds the pack images for a kind. */
export const TAXONOMY_IMAGE_BUCKET: Record<TaxonomyKind, string> = {
  category: "categories",
  brand: "brands",
};

/** Each list's own page, as a route pattern (F-87c): revalidate with type "page". */
export const TAXONOMY_PAGE_HREF: Record<TaxonomyKind, string> = {
  category: "/stores/[storeId]/products/categories",
  brand: "/stores/[storeId]/products/brands",
};

/** Bucket and folder seller uploads go to (useSellerUpload writes `logos/<sellerId>/<file>`). */
export const TAXONOMY_UPLOAD_BUCKET = "sellers";
export const TAXONOMY_UPLOAD_FOLDER = "logos";

/**
 * Whether an image URL is a public file in the seller uploads folder of this
 * project's storage, so a client can't point an item at any other URL: the
 * seller's own `logos/<sellerId>/` folder, or a flat `logos/<file>` from
 * before 0152 (an item keeps its older image when edited).
 */
export function isSellerTaxonomyImage(url: string, supabaseUrl: string | undefined, sellerId?: string): boolean {
  if (!supabaseUrl) return false;
  const prefix = `${supabaseUrl.replace(/\/+$/, "")}/storage/v1/object/public/${TAXONOMY_UPLOAD_BUCKET}/${TAXONOMY_UPLOAD_FOLDER}/`;
  if (!url.startsWith(prefix)) return false;
  let file = url.slice(prefix.length);
  const own = sellerId ? `${sellerId.toLowerCase()}/` : null;
  if (own && file.startsWith(own)) file = file.slice(own.length);
  return /^[\w%.-]+$/.test(file) && !file.startsWith(".") && !file.includes("..");
}

/** The list order sorted A–Z by the label shown in this locale. */
export function sortTaxonomyByLabel<T extends { name: string; nameAr: string | null }>(items: T[], locale: string): T[] {
  const collator = new Intl.Collator(locale, { sensitivity: "base", numeric: true });
  return [...items].sort((a, b) => collator.compare(taxonomyLabel(a, locale), taxonomyLabel(b, locale)));
}

/** Postgres check violation (23514): the 0171 parent guard trigger, also when wrapped. */
export function isCheckViolation(error: unknown): boolean {
  for (let e = error, depth = 0; e && typeof e === "object" && depth < 4; depth++) {
    if ((e as { code?: unknown }).code === "23514") return true;
    e = (e as { cause?: unknown }).cause;
  }
  return false;
}

type TreeNode = { id: string; parentId: string | null };

/**
 * The list (already in tree order, as `loadSellerTaxonomyList` returns it) as
 * main rows with their sub-categories. A row whose parent isn't a main row of
 * this list shows as a main row, so nothing is ever hidden. Brands: every row
 * is a main row.
 */
export function groupTaxonomyTree<T extends TreeNode>(items: T[]): Array<{ item: T; children: T[] }> {
  const mainIds = new Set(items.filter((i) => !i.parentId || !items.some((p) => p.id === i.parentId && !p.parentId)).map((i) => i.id));
  const groups: Array<{ item: T; children: T[] }> = [];
  const byId = new Map<string, { item: T; children: T[] }>();
  for (const item of items) {
    if (!mainIds.has(item.id)) continue;
    const group = { item, children: [] as T[] };
    groups.push(group);
    byId.set(item.id, group);
  }
  for (const item of items) if (!mainIds.has(item.id)) byId.get(item.parentId!)!.children.push(item);
  return groups;
}

/** Back to one list: each main row, then its sub-categories (what `reorderTaxonomyItems` takes). */
export function flattenTaxonomyGroups<T>(groups: Array<{ item: T; children: T[] }>): T[] {
  return groups.flatMap((g) => [g.item, ...g.children]);
}

function moveInArray<T>(list: T[], from: number, to: number): T[] {
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved!);
  return next;
}

/**
 * Drag `activeId` onto `overId`. Only siblings move: a main row among main
 * rows (it carries its sub-categories), a sub-category within its own main
 * category. Anything else (a sub-category onto another main row…) returns
 * null and nothing moves.
 */
export function moveTaxonomyItem<T extends TreeNode>(items: T[], activeId: string, overId: string): T[] | null {
  if (activeId === overId) return null;
  const groups = groupTaxonomyTree(items);
  const from = groups.findIndex((g) => g.item.id === activeId);
  const to = groups.findIndex((g) => g.item.id === overId);
  if (from >= 0 && to >= 0) return flattenTaxonomyGroups(moveInArray(groups, from, to));
  for (const group of groups) {
    const a = group.children.findIndex((c) => c.id === activeId);
    const b = group.children.findIndex((c) => c.id === overId);
    if (a >= 0 && b >= 0) {
      return flattenTaxonomyGroups(groups.map((g) => (g === group ? { ...g, children: moveInArray(g.children, a, b) } : g)));
    }
  }
  return null;
}

/** "Sort A–Z" for a tree: main rows A–Z, and the sub-categories A–Z inside each. */
export function sortTaxonomyTreeByLabel<T extends TreeNode & { name: string; nameAr: string | null }>(items: T[], locale: string): T[] {
  const groups = groupTaxonomyTree(items);
  const sortedMains = sortTaxonomyByLabel(
    groups.map((g) => g.item),
    locale,
  );
  const childrenOf = new Map(groups.map((g) => [g.item.id, sortTaxonomyByLabel(g.children, locale)]));
  return flattenTaxonomyGroups(sortedMains.map((item) => ({ item, children: childrenOf.get(item.id) ?? [] })));
}

/** Main categories a category may be filed under: main rows, never itself. */
export function parentChoices<T extends TreeNode>(items: T[], selfId?: string): T[] {
  return groupTaxonomyTree(items)
    .map((g) => g.item)
    .filter((item) => item.id !== selfId && !item.parentId);
}

/**
 * File `id` under `parentId` (or make it a main category with null), where the
 * server puts it: after the last sub-category of its new main category, or at
 * the end of the list (`updateTaxonomyItem` gives it the next position).
 */
export function placeTaxonomyItem<T extends TreeNode>(items: T[], id: string, parentId: string | null): T[] {
  const item = items.find((i) => i.id === id);
  if (!item) return items;
  const moved = { ...item, parentId };
  const rest = items.filter((i) => i.id !== id);
  if (!parentId) return [...rest, moved];
  const groups = groupTaxonomyTree(rest);
  const group = groups.find((g) => g.item.id === parentId);
  if (!group) return [...rest, moved];
  return flattenTaxonomyGroups(groups.map((g) => (g === group ? { ...g, children: [...g.children, moved] } : g)));
}
