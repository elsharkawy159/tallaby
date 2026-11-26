import { normalizePrice } from "@/lib/utils/product-pricing.lib";
import { roundPriceByRule, type PriceRoundingRule } from "@workspace/lib/products/price-rounding";

/**
 * What the product form tells the seller about the store's price rounding
 * rule (ROADMAP.md F-112b): the server rounds the price and the sale price on
 * save, so the form shows the values that will be stored. Pure; the same rule
 * maths as the server (`roundPriceByRule`).
 */
export type PriceRoundingHint =
  | { kind: "none" }
  /** The discount goes: after rounding the sale price is not lower than the price, saved as `price`. */
  | { kind: "dropped"; price: number }
  /** `price` / `salePrice`: the rounded value, only when it differs from what was typed. */
  | { kind: "rounded"; price: number | null; salePrice: number | null };

const positive = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;

/** `list`: the price typed; `final`: the sale price when the discount is on (else ignored). */
export function priceRoundingHint(
  list: unknown,
  final: unknown,
  rule: PriceRoundingRule | null | undefined,
): PriceRoundingHint {
  if (!rule?.enabled || !positive(list)) return { kind: "none" };
  const typedList = normalizePrice(list);
  const roundedList = roundPriceByRule(typedList, rule);
  const onSale = positive(final) && normalizePrice(final) < typedList;
  if (!onSale) {
    return roundedList !== typedList ? { kind: "rounded", price: roundedList, salePrice: null } : { kind: "none" };
  }
  const typedFinal = normalizePrice(final);
  const roundedFinal = roundPriceByRule(typedFinal, rule);
  if (roundedList <= roundedFinal) return { kind: "dropped", price: roundedFinal };
  const price = roundedList !== typedList ? roundedList : null;
  const salePrice = roundedFinal !== typedFinal ? roundedFinal : null;
  return price === null && salePrice === null ? { kind: "none" } : { kind: "rounded", price, salePrice };
}
