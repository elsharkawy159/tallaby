import { roundPriceJsonByRule, type PriceRoundingRule } from "@workspace/lib/products/price-rounding";

/**
 * "Round existing prices" (ROADMAP.md F-112c). Pure planning: given the
 * store's products and variants (already scoped to the seller and the store by
 * the server) and the saved rule, which prices change and to what. The server
 * runs it for the preview and again inside the apply transaction, so the
 * preview is advisory and the write is authoritative.
 *
 * Only a price jsonb object with a positive `final` is rounded. A legacy
 * scalar price, or a variant with no price of its own (it uses the product's),
 * is left alone.
 */

/** Stores above this many products (not in Trash) are refused, to keep one apply bounded. */
export const STORE_PRICE_ROUNDING_MAX_PRODUCTS = 5000;
/** Rows the preview returns; the rest is counted ("and N more"). */
export const STORE_PRICE_ROUNDING_PREVIEW_ROWS = 200;

export type PricedRow = { id: string; price: unknown };
export type PricedVariantRow = PricedRow & { productId: string | null; title: string | null };

/** Old → new, as the preview shows it. A compare-at price is null when there is no discount. */
export type PriceChangeView = {
  oldFinal: number;
  newFinal: number;
  oldCompareAt: number | null;
  newCompareAt: number | null;
  discountRemoved: boolean;
};

/** A change plus what the server writes: `prev` is the price read (the write's guard), `next` the new jsonb. */
export type PriceChange = PriceChangeView & { prev: unknown; next: Record<string, unknown> };

export type ProductRoundingPlan = {
  id: string;
  /** The product's own price, or null when it does not change. */
  change: PriceChange | null;
  variants: { id: string; title: string | null; change: PriceChange }[];
};

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

const cents = (value: number) => Math.round(value * 100);
const compareAt = (list: number, final: number) => (cents(list) > cents(final) ? list : null);

/** The rounded price, or null when the price is not roundable or nothing changes. */
export function planPriceRounding(price: unknown, rule: PriceRoundingRule): PriceChange | null {
  if (!price || typeof price !== "object" || Array.isArray(price)) return null;
  const obj = price as Record<string, unknown>;
  const final = num(obj.final);
  if (final == null || final <= 0) return null;
  const listRaw = num(obj.list);
  const baseRaw = num(obj.base);
  const list = listRaw != null && listRaw > 0 ? listRaw : baseRaw != null && baseRaw > 0 ? baseRaw : final;
  const base = baseRaw != null && baseRaw > 0 ? baseRaw : list;
  const discountType = obj.discountType === "percent" || obj.discountType === "amount" ? obj.discountType : null;
  const discountValue = num(obj.discountValue);

  const next = roundPriceJsonByRule({ ...obj, base, list, final, discountType, discountValue }, rule);
  if (cents(next.final) === cents(final) && cents(next.list) === cents(list) && cents(next.base) === cents(base)) return null;

  const oldCompareAt = compareAt(list, final);
  const newCompareAt = compareAt(next.list, next.final);
  return {
    oldFinal: final,
    newFinal: next.final,
    oldCompareAt,
    newCompareAt,
    discountRemoved: oldCompareAt != null && newCompareAt == null,
    prev: price,
    next,
  };
}

/**
 * Every product with a price that changes (its own or a variant's), in the
 * order of `products`, with the totals. Variants of products not in
 * `products` are ignored.
 */
export function planStoreRounding(
  products: readonly PricedRow[],
  variants: readonly PricedVariantRow[],
  rule: PriceRoundingRule,
): { plans: ProductRoundingPlan[]; productCount: number; variantCount: number } {
  const byProduct = new Map<string, ProductRoundingPlan["variants"]>();
  const known = new Set(products.map((p) => p.id));
  let variantCount = 0;
  for (const variant of variants) {
    if (!variant.productId || !known.has(variant.productId)) continue;
    const change = planPriceRounding(variant.price, rule);
    if (!change) continue;
    variantCount += 1;
    const list = byProduct.get(variant.productId) ?? [];
    list.push({ id: variant.id, title: variant.title, change });
    byProduct.set(variant.productId, list);
  }

  const plans: ProductRoundingPlan[] = [];
  let productCount = 0;
  for (const product of products) {
    const change = planPriceRounding(product.price, rule);
    const changedVariants = byProduct.get(product.id) ?? [];
    if (change) productCount += 1;
    if (change || changedVariants.length) plans.push({ id: product.id, change, variants: changedVariants });
  }
  return { plans, productCount, variantCount };
}

/** A change without the write fields, for the client. */
export function toChangeView({ oldFinal, newFinal, oldCompareAt, newCompareAt, discountRemoved }: PriceChange): PriceChangeView {
  return { oldFinal, newFinal, oldCompareAt, newCompareAt, discountRemoved };
}
