import {
  DEFAULT_PRICE_ROUNDING_TIER,
  PRICE_ROUNDING_MAX_STEP,
  PRICE_ROUNDING_STEP_PRESETS,
  priceRoundingSchema,
  type PriceRoundingDirection,
  type PriceRoundingRule,
} from "@workspace/lib/products/price-rounding";

/** Error keys under `storePriceRounding.errors.*`. */
export type PriceRoundingErrorKey = "invalidInput" | "readOnly" | "notFound" | "rateLimited" | "generic" | "upToInvalid" | "upToOrder" | "stepInvalid";

export type PriceRoundingSaveResult = { success: true; rule: PriceRoundingRule | null } | { success: false; error: PriceRoundingErrorKey };

/** One tier as the card edits it: text inputs, a step preset or "custom". */
export type PriceRoundingRow = {
  upTo: string;
  step: string;
  customStep: string;
  direction: PriceRoundingDirection;
};

export const CUSTOM_STEP = "custom";

const isPreset = (step: number) => (PRICE_ROUNDING_STEP_PRESETS as readonly number[]).includes(step);

const amountText = (value: number) => (Number.isInteger(value) ? String(value) : value.toFixed(2));

export function tierToRow(tier: { upTo: number | null; step: number; direction: PriceRoundingDirection }): PriceRoundingRow {
  return {
    upTo: tier.upTo == null ? "" : amountText(tier.upTo),
    step: isPreset(tier.step) ? String(tier.step) : CUSTOM_STEP,
    customStep: isPreset(tier.step) ? "" : String(tier.step),
    direction: tier.direction,
  };
}

export const DEFAULT_PRICE_ROUNDING_ROW: PriceRoundingRow = tierToRow(DEFAULT_PRICE_ROUNDING_TIER);

/** The saved rule as card rows (one default row when there is none). */
export function ruleToRows(rule: PriceRoundingRule | null): PriceRoundingRow[] {
  return rule?.tiers.length ? rule.tiers.map(tierToRow) : [DEFAULT_PRICE_ROUNDING_ROW];
}

/** "1,200.50" / "١٢٠٠" → 1200.5; anything else → null. */
function parseAmount(text: string): number | null {
  const ascii = text
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[,،\s]/g, "")
    .replace("٫", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(ascii)) return null;
  const value = Number(ascii);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** A row's step, or null when the custom step is not a whole number 1–10,000. */
export function rowStep(row: PriceRoundingRow): number | null {
  const raw = row.step === CUSTOM_STEP ? parseAmount(row.customStep) : Number(row.step);
  return raw != null && Number.isInteger(raw) && raw >= 1 && raw <= PRICE_ROUNDING_MAX_STEP ? raw : null;
}

/** A row's "up to" amount (null for the last row, or when it is not a valid amount). */
export function rowUpTo(row: PriceRoundingRow): number | null {
  return parseAmount(row.upTo);
}

/**
 * The card's rows as the rule to save. The last row has no "up to"; every other
 * row needs one, higher than the row before it.
 */
export function rowsToRule(
  enabled: boolean,
  rows: readonly PriceRoundingRow[],
): { ok: true; rule: PriceRoundingRule } | { ok: false; error: PriceRoundingErrorKey; row: number } {
  const tiers: PriceRoundingRule["tiers"] = [];
  let previous = 0;
  for (const [index, row] of rows.entries()) {
    const last = index === rows.length - 1;
    const step = rowStep(row);
    if (step == null) return { ok: false, error: "stepInvalid", row: index };
    let upTo: number | null = null;
    if (!last) {
      upTo = rowUpTo(row);
      if (upTo == null) return { ok: false, error: "upToInvalid", row: index };
      if (upTo <= previous) return { ok: false, error: "upToOrder", row: index };
      previous = upTo;
    }
    tiers.push({ upTo, step, direction: row.direction });
  }
  const parsed = priceRoundingSchema.safeParse({ enabled, tiers });
  return parsed.success ? { ok: true, rule: parsed.data } : { ok: false, error: "invalidInput", row: 0 };
}
