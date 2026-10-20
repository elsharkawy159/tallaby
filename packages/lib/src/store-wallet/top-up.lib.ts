/**
 * Store-wallet top-ups (PLAN.md §13.4, P6-09/P6-10). Pure.
 */
import { z } from "zod";
import { EGYPT_MOBILE_REGEX } from "../fulfillment/validate";

/** D23, raised to EGP 100 by the owner (2026-10-18): EGP 100 to EGP 20,000 per top-up. */
export const STORE_TOP_UP_MIN_EGP = 100;
export const STORE_TOP_UP_MIN_PIASTRES = STORE_TOP_UP_MIN_EGP * 100;
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

// ---------------------------------------------------------------------------
// Manual top-ups (owner request 2026-10-18): the seller transfers by Vodafone
// Cash or InstaPay, uploads the receipt, and the top-up stays pending until a
// Tallaby admin approves it. Only the approval credits the wallet.
// ---------------------------------------------------------------------------

export const MANUAL_TOP_UP_METHODS = ["vodafone_cash", "instapay"] as const;
export type ManualTopUpMethod = (typeof MANUAL_TOP_UP_METHODS)[number];

/** Masked account holder name shown to sellers (owner-provided, 2026-10-18). */
const TOP_UP_ACCOUNT_HOLDER = "عمر م*** ع******* ا**** م***";

/** Where sellers send the money (owner-provided, 2026-10-18). */
export const TALLABY_TOP_UP_ACCOUNTS: Record<ManualTopUpMethod, { number: string; holder: string }> = {
  vodafone_cash: { number: "01003272830", holder: TOP_UP_ACCOUNT_HOLDER },
  instapay: { number: "01152372358", holder: TOP_UP_ACCOUNT_HOLDER },
};

/** Private bucket: sellers upload into their own folder, admins read through signed URLs. */
export const TOP_UP_PROOF_BUCKET = "store-top-up-proofs";
export const TOP_UP_PROOF_MAX_BYTES = 5 * 1024 * 1024;
export const TOP_UP_PROOF_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
/** A seller can have this many top-ups waiting for review at once. */
export const MAX_OPEN_MANUAL_TOP_UPS = 3;

const PROOF_EXT: Record<(typeof TOP_UP_PROOF_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/** "{sellerId}/{uuid}.{ext}" for a new receipt, or null for an unsupported file type. */
export function buildTopUpProofPath(sellerId: string, fileId: string, mimeType: string): string | null {
  const ext = PROOF_EXT[mimeType as keyof typeof PROOF_EXT];
  return ext ? `${sellerId}/${fileId}.${ext}` : null;
}

/** Only receipts inside the seller's own folder, in the shape buildTopUpProofPath makes. */
export function isOwnTopUpProofPath(sellerId: string, path: unknown): path is string {
  if (typeof path !== "string" || !new RegExp(`^${UUID}$`, "i").test(sellerId)) return false;
  return new RegExp(`^${sellerId}/${UUID}\\.(jpg|png|webp)$`, "i").test(path);
}

export const manualTopUpInputSchema = z
  .object({
    method: z.enum(MANUAL_TOP_UP_METHODS),
    amount: z.union([z.string(), z.number()]),
    proofPath: z.string().max(200),
    /** The number the seller sent from, so the admin can match the transfer. */
    senderPhone: z
      .string()
      .transform((v) => v.replace(/[\s-]/g, ""))
      .pipe(z.string().regex(EGYPT_MOBILE_REGEX))
      .optional(),
  })
  .strict();
export type ManualTopUpInput = z.input<typeof manualTopUpInputSchema>;
