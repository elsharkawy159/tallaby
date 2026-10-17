/**
 * Store-wallet top-ups (PLAN.md §13.4, P6-09/P6-10). Pure.
 */

/** D23 (recommended default, owner may change): EGP 50 to EGP 20,000 per top-up. */
export const STORE_TOP_UP_MIN_PIASTRES = 5_000;
export const STORE_TOP_UP_MAX_PIASTRES = 2_000_000;

const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const REFERENCE_RE = new RegExp(`^stopup_(${UUID})$`, "i");

/** Kashier merchantOrderId for a top-up row. One session per row. */
export function buildStoreTopUpReference(topUpId: string): string {
  return `stopup_${topUpId}`;
}

/** The top-up id inside a Kashier merchantOrderId, or null for anything else (orders included). */
export function parseStoreTopUpReference(reference: string | null | undefined): string | null {
  const match = reference ? REFERENCE_RE.exec(reference) : null;
  return match ? match[1]!.toLowerCase() : null;
}

export type TopUpAmountResult =
  | { success: true; piastres: number; amount: string }
  | { success: false; error: "invalid" | "too_small" | "too_large" };

/** Parses a seller-entered EGP amount (up to 2 decimals). */
export function parseStoreTopUpAmount(raw: unknown): TopUpAmountResult {
  const text = typeof raw === "number" ? String(raw) : typeof raw === "string" ? raw.trim().replace(",", ".") : "";
  if (!/^\d{1,7}(\.\d{1,2})?$/.test(text)) return { success: false, error: "invalid" };
  const piastres = Math.round(Number(text) * 100);
  if (piastres < STORE_TOP_UP_MIN_PIASTRES) return { success: false, error: "too_small" };
  if (piastres > STORE_TOP_UP_MAX_PIASTRES) return { success: false, error: "too_large" };
  return { success: true, piastres, amount: (piastres / 100).toFixed(2) };
}
