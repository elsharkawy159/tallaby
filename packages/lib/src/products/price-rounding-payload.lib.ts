/**
 * Applies a store's price rounding rule (ROADMAP.md F-112b) to the price a
 * seller writer is about to save. Pure; no DB imports. The rule itself and its
 * maths live in `./price-rounding.lib` (F-112a); this file only adapts the
 * shapes the writers hold (a `products.price` / `product_variants.price` jsonb
 * that may miss `base` or carry extra keys, and a variant row with its own
 * `discountEndsAt` column).
 *
 * Only the customer price (`final`) and the compare-at price (`list`, `base`)
 * are rounded. A null rule (or one that is off) returns the input unchanged,
 * so a store without the setting saves exactly what it saved before.
 */
import { roundPriceJsonByRule, type PriceRoundingRule } from "./price-rounding.lib";

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

const positive = (value: unknown): number | null => {
  const n = num(value);
  return n != null && n > 0 ? n : null;
};

/**
 * A price jsonb after the rule. Anything that is not a price object with a
 * positive `final` (or `list`) is returned as it is: the writers keep their
 * own validation, rounding never invents a price. Extra keys are kept; a
 * discount whose rounded compare-at price is not higher is dropped (no fake
 * discounts), clearing `discountEndsAt` when the object has one.
 */
export function roundPricePayload<T>(price: T, rule: PriceRoundingRule | null | undefined): T {
  if (!rule?.enabled) return price;
  if (!price || typeof price !== "object" || Array.isArray(price)) return price;
  const obj = price as Record<string, unknown>;
  const final = positive(obj.final) ?? positive(obj.list) ?? positive(obj.base);
  if (final == null) return price;
  const list = positive(obj.list) ?? positive(obj.base) ?? final;
  const base = positive(obj.base) ?? list;
  const discountType = obj.discountType === "percent" || obj.discountType === "amount" ? obj.discountType : null;
  return roundPriceJsonByRule(
    { ...obj, base, list, final, discountType, discountValue: num(obj.discountValue) },
    rule,
  ) as T;
}

/** True when the price object carries a discount (compare-at above the customer price). */
export function priceHasDiscount(price: unknown): boolean {
  if (!price || typeof price !== "object" || Array.isArray(price)) return false;
  const obj = price as Record<string, unknown>;
  const final = positive(obj.final);
  const list = positive(obj.list) ?? positive(obj.base);
  return final != null && list != null && list > final;
}

/**
 * A variant row (`{ price, discountEndsAt? }`) after the rule: its price is
 * rounded, and when that drops the discount the row's own `discountEndsAt`
 * column is cleared too. Other fields are untouched.
 */
export function roundVariantPriceRow<T extends { price?: unknown; discountEndsAt?: string | null }>(
  row: T,
  rule: PriceRoundingRule | null | undefined,
): T {
  if (!rule?.enabled || row.price == null) return row;
  const price = roundPricePayload(row.price, rule);
  const dropped = priceHasDiscount(row.price) && !priceHasDiscount(price);
  return {
    ...row,
    price,
    ...(dropped && "discountEndsAt" in row ? { discountEndsAt: null } : {}),
  };
}
