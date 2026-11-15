import { flattenCategoryTree, normalizeSearchText, suggestCategories, type CategoryPathEntry } from "./add-product.lib";
import type { CategoryOption } from "./add-product.schema";
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto";

/** One row of the category picker. */
export type CategoryChoice =
  | { kind: "store"; option: SellerTaxonomyOption; label: string }
  | { kind: "tallaby"; entry: CategoryPathEntry; label: string; parentLabel: string }
  | { kind: "new"; label: string };

/** A Tallaby category in the shown language, ready to search. */
export type TallabyCategory = CategoryPathEntry & { label: string; parentLabel: string; haystack: string };

export const categoryLabel = (category: Pick<CategoryOption, "name" | "nameAr">, locale: string) =>
  locale === "ar" ? category.nameAr || category.name : category.name;

/** Every Tallaby category with its path labels, searchable in both languages. */
export function indexTallabyCategories(tree: CategoryOption[], locale: string): TallabyCategory[] {
  return flattenCategoryTree(tree).map((entry) => {
    const parents = entry.path.slice(0, -1);
    return {
      ...entry,
      label: categoryLabel(entry.category, locale),
      parentLabel: parents.map((p) => categoryLabel(p, locale)).join(" › "),
      haystack: normalizeSearchText(
        entry.path.flatMap((p) => [p.name, p.nameAr ?? ""]).join(" ")
      ),
    };
  });
}

/** A store category's own name in the shown language. */
export const storeOptionOwnLabel = (option: SellerTaxonomyOption, locale: string) =>
  locale === "ar" && option.nameAr?.trim() ? option.nameAr : option.name;

/** A store category as the picker shows it: "Main › Sub" for a sub-category (0171), else its name. */
export function storeOptionLabel(option: SellerTaxonomyOption, locale: string): string {
  const own = storeOptionOwnLabel(option, locale);
  if (!option.parentId || !option.parentName) return own;
  const parent = locale === "ar" && option.parentNameAr?.trim() ? option.parentNameAr : option.parentName;
  return `${parent} › ${own}`;
}

/** Catch-all Tallaby category ("Other", "Misc"…), else the first leaf: the match of last resort. */
export function fallbackTallabyCategoryId(tallaby: TallabyCategory[]): string | undefined {
  const leaves = tallaby.filter((c) => c.isLeaf);
  const catchAll = leaves.find((c) =>
    /\b(other|others|misc|miscellaneous|general)\b|أخرى|اخرى|متنوع/i.test(
      `${c.category.name} ${c.category.nameAr ?? ""} ${c.category.slug}`
    )
  );
  return (catchAll ?? leaves[0] ?? tallaby[0])?.category.id;
}

/** Closest Tallaby category for a store/new category name, then that name plus the product names. */
export function matchTallabyCategoryId(
  categories: CategoryOption[],
  name: string,
  titles: (string | undefined)[] = []
): string | undefined {
  return (
    suggestCategories(categories, { titles: [name] }, 1)[0] ??
    suggestCategories(categories, { titles: [name, ...titles] }, 1)[0]
  )?.category.id;
}

/**
 * The Tallaby category (`products.category_id`, still required) behind a store
 * or new category, picked without asking as the product form does: the one the
 * store category was copied from, else the closest match, else `current`, else
 * the catch-all.
 */
export function tallabyCategoryFor(
  pick: { kind: "store"; option: SellerTaxonomyOption } | { kind: "new"; name: string },
  ctx: { categories: CategoryOption[]; tallaby: TallabyCategory[]; titles?: (string | undefined)[]; current?: string; locale?: string }
): string | undefined {
  if (pick.kind === "store" && pick.option.sourceId && ctx.tallaby.some((c) => c.category.id === pick.option.sourceId)) {
    return pick.option.sourceId;
  }
  // A sub-category matches on its own name, not "Main › Sub".
  const name = pick.kind === "store" ? storeOptionOwnLabel(pick.option, ctx.locale ?? "en") : pick.name;
  return matchTallabyCategoryId(ctx.categories, name, ctx.titles) ?? (ctx.current || fallbackTallabyCategoryId(ctx.tallaby));
}

const tokensOf = (query: string) => normalizeSearchText(query).split(" ").filter(Boolean);

/** Same name in either language, ignoring case and Arabic letter variants. */
export function sameCategoryName(a: string, b: string) {
  return normalizeSearchText(a) === normalizeSearchText(b);
}

const TALLABY_RESULTS = 20;
const TALLABY_BROWSE = 6;

/**
 * Picker rows for what the seller typed: their store's categories first, then
 * Tallaby's (leaf names that start with the query first), then "Add «…»" when
 * nothing has that exact name. With no query, `suggested` (matches for the
 * product name) or the top-level Tallaby categories stand in.
 */
export function searchCategoryChoices({
  query,
  store,
  tallaby,
  suggested,
  locale,
  allowNew,
}: {
  query: string;
  store: SellerTaxonomyOption[];
  tallaby: TallabyCategory[];
  suggested: TallabyCategory[];
  locale: string;
  allowNew: boolean;
}): CategoryChoice[] {
  const trimmed = query.trim();
  const tokens = tokensOf(trimmed);
  const matchesAll = (text: string) => tokens.every((token) => text.includes(token));

  const storeRows = store
    .filter(
      (option) =>
        !tokens.length ||
        matchesAll(normalizeSearchText(`${option.name} ${option.nameAr ?? ""} ${option.parentName ?? ""} ${option.parentNameAr ?? ""}`))
    )
    .map((option) => ({ kind: "store" as const, option, label: storeOptionLabel(option, locale) }));

  // A Tallaby category the store already copied shows once, as the store's.
  const copied = new Set(store.map((o) => o.sourceId).filter(Boolean));
  let tallabyRows: TallabyCategory[];
  if (tokens.length) {
    const first = tokens[0]!;
    const rank = (c: TallabyCategory) => {
      const own = normalizeSearchText(`${c.category.name} ${c.category.nameAr ?? ""}`);
      return (own.split(" ").some((w) => w.startsWith(first)) ? 0 : 2) + (c.isLeaf ? 0 : 1);
    };
    tallabyRows = tallaby
      .filter((c) => !copied.has(c.category.id) && matchesAll(c.haystack))
      .sort((a, b) => rank(a) - rank(b) || a.path.length - b.path.length)
      .slice(0, TALLABY_RESULTS);
  } else {
    const base = suggested.length ? suggested : tallaby.filter((c) => c.path.length === 1);
    tallabyRows = base.filter((c) => !copied.has(c.category.id)).slice(0, TALLABY_BROWSE);
  }

  const rows: CategoryChoice[] = [
    ...storeRows,
    ...tallabyRows.map((c) => ({ kind: "tallaby" as const, entry: c, label: c.label, parentLabel: c.parentLabel })),
  ];

  const exact =
    store.some((o) => sameCategoryName(o.name, trimmed) || (o.nameAr != null && sameCategoryName(o.nameAr, trimmed))) ||
    tallaby.some(
      (c) => sameCategoryName(c.category.name, trimmed) || (c.category.nameAr != null && sameCategoryName(c.category.nameAr, trimmed))
    );
  if (allowNew && trimmed && !exact) rows.push({ kind: "new", label: trimmed.replace(/\s+/g, " ") });
  return rows;
}

/** Folds letters one-for-one (case, alef/taa/yaa forms), so indexes still line up with the original text. */
const foldChars = (text: string) =>
  text.toLowerCase().replace(/[أإآٱ]/g, "ا").replace(/ة/g, "ه").replace(/ى/g, "ي");

/** Splits `text` around the first place the query appears, for highlighting. */
export function highlightMatch(text: string, query: string): [string, string, string] | null {
  const needle = foldChars(query.trim());
  if (!needle) return null;
  const at = foldChars(text).indexOf(needle);
  if (at < 0) return null;
  return [text.slice(0, at), text.slice(at, at + needle.length), text.slice(at + needle.length)];
}
