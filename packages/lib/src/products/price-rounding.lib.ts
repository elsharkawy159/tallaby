/**
 * Round product prices (ROADMAP.md F-112, owner 2026-11-26). Pure; no DB imports.
 *
 * A store can round every price a seller saves to a clean number (240, 250,
 * 1,200). The rule has 1–5 price-range tiers: each has an upper bound (the
 * last one has none), a step (a whole number of the store's currency, 1–10,000)
 * and a direction (up, down, nearest). The tier is picked by the price BEFORE
 * rounding. Money is computed in integer piastres (CLAUDE.md rule 7; a store in
 * another currency uses its cents the same way). A price never rounds to 0: it
 * becomes one step instead.
 *
 * The setting lives in `stores.settings.priceRounding = { enabled, tiers }`
 * (no migration). Turning it off keeps the tiers (`enabled: false`) so turning
 * it back on restores them.
 */
import { z } from "zod";
import { normalizePrice } from "../utils/round-price";

export const PRICE_ROUNDING_DIRECTIONS = ["up", "down", "nearest"] as const;
export type PriceRoundingDirection = (typeof PRICE_ROUNDING_DIRECTIONS)[number];

export type PriceRoundingTier = { upTo: number | null; step: number; direction: PriceRoundingDirection };
export type PriceRoundingRule = { enabled: boolean; tiers: PriceRoundingTier[] };

export const PRICE_ROUNDING_MAX_TIERS = 5;
export const PRICE_ROUNDING_MAX_STEP = 10_000;
/** Upper bound of a tier's "up to" amount (a sane cap, not a business rule). */
export const PRICE_ROUNDING_MAX_UP_TO = 100_000_000;
/** The steps the settings card offers; any whole number 1–10,000 is valid. */
export const PRICE_ROUNDING_STEP_PRESETS = [1, 5, 10, 20, 50, 100] as const;

/** The rule the card starts from when the seller first turns it on. */
export const DEFAULT_PRICE_ROUNDING_TIER: PriceRoundingTier = { upTo: null, step: 5, direction: "up" };

const hasAtMostTwoDecimals = (value: number) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-6;

const tierSchema = z
  .object({
    upTo: z
      .number()
      .finite()
      .positive()
      .max(PRICE_ROUNDING_MAX_UP_TO)
      .refine(hasAtMostTwoDecimals, { message: "upTo_decimals" })
      .nullable(),
    step: z.number().int().min(1).max(PRICE_ROUNDING_MAX_STEP),
    direction: z.enum(PRICE_ROUNDING_DIRECTIONS),
  })
  .strict();

/**
 * `{ enabled, tiers }`: 1–5 tiers; only the last tier has `upTo: null`; every
 * other `upTo` is a positive amount (≤ 2 decimals) that strictly increases.
 */
export const priceRoundingSchema = z
  .object({
    enabled: z.boolean(),
    tiers: z.array(tierSchema).min(1).max(PRICE_ROUNDING_MAX_TIERS),
  })
  .strict()
  .superRefine((rule, ctx) => {
    const last = rule.tiers.length - 1;
    let previous = 0;
    rule.tiers.forEach((tier, index) => {
      if (index === last) {
        if (tier.upTo !== null) ctx.addIssue({ code: "custom", message: "last_tier_open", path: ["tiers", index, "upTo"] });
        return;
      }
      if (tier.upTo === null) {
        ctx.addIssue({ code: "custom", message: "tier_needs_up_to", path: ["tiers", index, "upTo"] });
        return;
      }
      if (tier.upTo <= previous) ctx.addIssue({ code: "custom", message: "up_to_not_increasing", path: ["tiers", index, "upTo"] });
      previous = tier.upTo;
    });
  });

/** The saved rule when valid, on or off; null when missing or invalid (the settings card reads this). */
export function readPriceRoundingSetting(settings: unknown): PriceRoundingRule | null {
  if (!settings || typeof settings !== "object") return null;
  const parsed = priceRoundingSchema.safeParse((settings as Record<string, unknown>).priceRounding);
  return parsed.success ? parsed.data : null;
}

/** `stores.settings.priceRounding` when valid and on, else null (prices are saved as entered). */
export function parsePriceRounding(settings: unknown): PriceRoundingRule | null {
  const rule = readPriceRoundingSetting(settings);
  return rule?.enabled ? rule : null;
}

/** The tier a price (in piastres, before rounding) falls in. */
function tierFor(piastres: number, tiers: readonly PriceRoundingTier[]): PriceRoundingTier | null {
  return tiers.find((tier) => tier.upTo == null || piastres <= Math.round(tier.upTo * 100)) ?? tiers[tiers.length - 1] ?? null;
}

function roundPiastres(piastres: number, tier: PriceRoundingTier): number {
  const step = tier.step * 100;
  let rounded: number;
  if (tier.direction === "up") rounded = Math.ceil(piastres / step) * step;
  else if (tier.direction === "down") rounded = Math.floor(piastres / step) * step;
  // Half up, in integers: floor((2p + s) / 2s) × s.
  else rounded = Math.floor((piastres * 2 + step) / (step * 2)) * step;
  return rounded <= 0 ? step : rounded;
}

/**
 * A price after the store's rule, in currency units. No rule (or off) →
 * {@link normalizePrice} (exactly what the seller entered, to the piastre).
 * Not a positive finite number → 0.
 */
export function roundPriceByRule(price: number, rule: PriceRoundingRule | null): number {
  const normalized = normalizePrice(price);
  if (!rule?.enabled || normalized <= 0) return normalized;
  const piastres = Math.round(normalized * 100);
  const tier = tierFor(piastres, rule.tiers);
  if (!tier) return normalized;
  return roundPiastres(piastres, tier) / 100;
}

/**
 * The product and variant `price` jsonb (`products.price`, `product_variants.price`):
 * `final` is what the customer pays, `list` (and `base`) the struck-through
 * compare-at price. The dashboard writes `discountType` "percent" or "amount";
 * the agent writes "amount".
 */
export type RoundablePriceJson = {
  base: number;
  list: number;
  final: number;
  discountType: "percent" | "amount" | null;
  discountValue: number | null;
  discountEndsAt?: string | null;
};

/**
 * Rounds `final`, `list` and `base` with the rule and recomputes the discount
 * (a "percent" discount stays a percent, anything else becomes "amount"). When
 * the rounded compare-at price is not higher than the rounded price, the
 * discount is dropped (no fake discounts): base = list = final, no discount,
 * no end date. No rule (or off) → the input unchanged.
 */
export function roundPriceJsonByRule<T extends RoundablePriceJson>(price: T, rule: PriceRoundingRule | null): T {
  if (!rule?.enabled) return price;
  const final = roundPriceByRule(price.final, rule);
  const list = roundPriceByRule(price.list, rule);
  const hasEndsAt = "discountEndsAt" in price;

  if (list <= final) {
    return {
      ...price,
      base: final,
      list: final,
      final,
      discountType: null,
      discountValue: null,
      ...(hasEndsAt ? { discountEndsAt: null } : {}),
    } as T;
  }

  const base = roundPriceByRule(price.base, rule);
  const amount = Number((list - final).toFixed(2));
  const percent = price.discountType === "percent";
  return {
    ...price,
    base,
    list,
    final,
    discountType: percent ? "percent" : "amount",
    discountValue: percent ? Number(((amount / list) * 100).toFixed(2)) : amount,
  } as T;
}
