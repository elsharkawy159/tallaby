import { addProductFormSchema, type AddProductFormData, type CategoryOption } from "./add-product.schema";
import { clip, META_DESCRIPTION, META_TITLE, slugFromNames } from "./prepare-product-submit.lib";
import { tallabyCategoryFor, type TallabyCategory } from "./category-search.lib";
import type { SellerTaxonomyOption } from "../categories-brands/categories-brands.dto";

/* Pure helpers of the bulk "add from links" list: apply-to-all, the tidy-up before saving, and what each row still needs. */

/** The product name's limit in the schema (and the name input's maxLength). */
export const PRODUCT_TITLE_MAX = 255;

/** A category chosen once for every row, as the category box picks it. */
export type BulkCategoryPick =
  | { kind: "store"; option: SellerTaxonomyOption }
  | { kind: "tallaby"; id: string }
  | { kind: "new"; name: string }

export interface BulkApplyOptions {
  category?: BulkCategoryPick
  /** Change on the fetched price: +10 % / -5 %, or a fixed amount in the store currency. */
  priceChange?: { mode: "percent" | "amount"; value: number }
  trackStock?: boolean
  /** Units in stock (products without variants, while stock is tracked). */
  quantity?: number
}

/** The price a row was fetched with, so a price change applies to it, never on top of an earlier change. */
export interface SourcePrice {
  list?: number
  final?: number
}

export interface BulkApplyContext {
  categories: CategoryOption[]
  tallaby: TallabyCategory[]
  /** The seller's store categories, so a Tallaby pick links the store's copy of it. */
  store: SellerTaxonomyOption[]
  locale: string
}

const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/** Whole piastres, so repeated changes never drift (CLAUDE.md rule 7). */
function changePrice (price: number, change: NonNullable<BulkApplyOptions["priceChange"]>): number {
  const piastres = Math.round(price * 100);
  const next =
    change.mode === "percent"
      ? Math.round(piastres * (1 + change.value / 100))
      : piastres + Math.round(change.value * 100);
  return next / 100;
}

/** One row with the chosen options applied; every other field stays as the seller left it. */
export function applyBulkOptions (
  values: AddProductFormData,
  source: SourcePrice | undefined,
  options: BulkApplyOptions,
  ctx: BulkApplyContext
): AddProductFormData {
  const next: AddProductFormData = { ...values, price: { ...values.price } };
  const titles = [values.localized?.en?.title, values.localized?.ar?.title];

  const pick = options.category;
  if (pick?.kind === "tallaby") {
    next.categoryId = pick.id;
    next.sellerCategoryName = "";
    next.sellerCategoryId = ctx.store.find((o) => o.sourceId === pick.id)?.id ?? "";
  } else if (pick) {
    next.categoryId =
      tallabyCategoryFor(pick, {
        categories: ctx.categories,
        tallaby: ctx.tallaby,
        titles,
        current: values.categoryId,
        locale: ctx.locale,
      }) ?? "";
    next.sellerCategoryId = pick.kind === "store" ? pick.option.id : "";
    next.sellerCategoryName = pick.kind === "new" ? pick.name.trim().replace(/\s+/g, " ") : "";
  }

  const change = options.priceChange;
  if (change && Number.isFinite(change.value) && positive(source?.list)) {
    const list = changePrice(source.list, change);
    const onSale = positive(source.final) && source.final < source.list;
    const final = onSale ? changePrice(source.final!, change) : list;
    next.price = {
      ...next.price,
      base: list,
      list,
      final,
      discountType: "amount",
      discountValue: onSale && final < list ? Math.round((list - final) * 100) / 100 : undefined,
    };
  }

  if (options.trackStock !== undefined) next.trackStock = options.trackStock;
  const hasVariants = (values.variants?.length ?? 0) > 0;
  if (options.quantity !== undefined && Number.isInteger(options.quantity) && options.quantity >= 0 && !hasVariants) {
    next.quantity = options.quantity;
  }
  return next;
}

/**
 * What the form fills on its own but a row that was never opened misses: a
 * name over the limit (pages often have longer ones), the link from the
 * names, the sale price equal to the price, SEO text within its limits.
 */
export function completeBulkValues (values: AddProductFormData): AddProductFormData {
  const localized = { en: { ...values.localized.en }, ar: { ...values.localized.ar } };
  for (const fields of [localized.en, localized.ar]) {
    if ((fields.title ?? "").length > PRODUCT_TITLE_MAX) fields.title = fields.title.slice(0, PRODUCT_TITLE_MAX).trim();
    if ((fields.metaTitle ?? "").length > META_TITLE.max) fields.metaTitle = clip(fields.metaTitle!, META_TITLE.max);
    if ((fields.metaDescription ?? "").length > META_DESCRIPTION.max) {
      fields.metaDescription = clip(fields.metaDescription!, META_DESCRIPTION.max);
    }
  }
  if (!(localized.en.slug ?? "").trim()) localized.en.slug = slugFromNames(localized);
  if (localized.en.slug.length > PRODUCT_TITLE_MAX) localized.en.slug = localized.en.slug.slice(0, PRODUCT_TITLE_MAX).replace(/-+$/, "");

  const price = { ...values.price };
  if (positive(price.list) && !positive(price.final)) price.final = price.list;

  return { ...values, localized, price };
}

/** What a row still needs, named the way the seller sees the form. */
export type BulkIssue = "name" | "description" | "category" | "images" | "price" | "variants" | "stock" | "other"

const ISSUE_ORDER: BulkIssue[] = ["name", "description", "category", "images", "price", "variants", "stock", "other"];

function issueOf (path: PropertyKey[]): BulkIssue {
  const [head, , field] = path;
  if (head === "categoryId" || head === "sellerCategoryName") return "category";
  if (head === "images") return "images";
  if (head === "price") return "price";
  if (head === "variants" || head === "variantTypes") return "variants";
  if (head === "quantity" || head === "minOrderQuantity" || head === "maxOrderQuantity" || head === "lowStockThreshold") return "stock";
  if (head === "localized") {
    if (field === "title" || field === "slug") return "name";
    if (field === "description") return "description";
  }
  return "other";
}

export interface BulkCheck {
  /** Valid values ready to save, or null. */
  data: AddProductFormData | null
  issues: BulkIssue[]
  /** "en" when every language-specific problem is in English (the form opens in Arabic). */
  locale?: "en" | "ar"
}

/** The same rules as the product form, on a row's values (after completeBulkValues). */
export function checkBulkValues (values: AddProductFormData): BulkCheck {
  const parsed = addProductFormSchema.safeParse(values);
  if (parsed.success) return { data: parsed.data, issues: [] };
  const found = new Set(parsed.error.issues.map((issue) => issueOf(issue.path)));
  const locales = new Set(
    parsed.error.issues.filter((issue) => issue.path[0] === "localized").map((issue) => issue.path[1] as string)
  );
  return {
    data: null,
    issues: ISSUE_ORDER.filter((issue) => found.has(issue)),
    locale: locales.size === 1 && locales.has("en") ? "en" : undefined,
  };
}
