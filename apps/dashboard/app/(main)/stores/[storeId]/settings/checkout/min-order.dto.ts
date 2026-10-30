import { z } from "zod";
import { MIN_ORDER_MAX_PIASTRES, type StoreMinOrder } from "@workspace/lib/stores/min-order";

/**
 * Store settings › Checkout › Minimum order (ROADMAP.md F-13b): the save
 * input. The seller types EGP (up to two decimals); it is stored as integer
 * piastres in `stores.settings.minOrder`.
 */

export const storeMinOrderSchema = z
  .object({
    enabled: z.boolean(),
    /** EGP as typed; may be empty while the minimum is off. */
    amount: z.union([z.string().max(20), z.number()]),
  })
  .strict();

export type StoreMinOrderInputError = "invalid" | "amountRequired" | "amountTooHigh";

/** "250", "250.5", "250.50" → piastres; null for anything else (no signs, no exponents, max two decimals). */
export function parseEgpAmount(value: string | number): number | null {
  const text = (typeof value === "number" ? String(value) : value).trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
  const match = /^(\d{1,9})(?:\.(\d{1,2}))?$/.exec(text);
  if (!match) return null;
  return Number(match[1]) * 100 + Number((match[2] ?? "").padEnd(2, "0"));
}

export function parseStoreMinOrderInput(
  input: unknown,
): { ok: true; value: StoreMinOrder } | { ok: false; error: StoreMinOrderInputError } {
  const parsed = storeMinOrderSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const { enabled, amount } = parsed.data;
  const empty = typeof amount === "string" && amount.trim() === "";
  const piastres = empty ? 0 : parseEgpAmount(amount);

  if (!enabled) {
    // Off: keep a valid amount for next time, drop anything else.
    const kept = piastres != null && piastres > 0 && piastres <= MIN_ORDER_MAX_PIASTRES ? piastres : 0;
    return { ok: true, value: { enabled: false, amountPiastres: kept } };
  }
  if (piastres == null) return { ok: false, error: "invalid" };
  if (piastres <= 0) return { ok: false, error: "amountRequired" };
  if (piastres > MIN_ORDER_MAX_PIASTRES) return { ok: false, error: "amountTooHigh" };
  return { ok: true, value: { enabled: true, amountPiastres: piastres } };
}
