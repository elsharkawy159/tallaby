/**
 * Admin › Tallaby Pay rules, pure (ROADMAP.md F-100g; design §8 and the
 * owner's answers in §14, 2026-11-18): the settings form, the wallet
 * adjustment form, the date filter and the list filters. Safe to import
 * anywhere; admin.server.ts does the reads and writes.
 */
import { z } from "zod";

import { ADMIN_REASON_MAX, ADMIN_REASON_MIN } from "../admin/admin.lib";
import { TALLABY_PAY_MAX_FEE_BPS, amountToPiastres } from "./fee.lib";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Arabic-Indic and Eastern Arabic digits → ASCII, so a pasted number parses. */
function asciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

const reason = z
  .string()
  .transform((s) => s.trim().replace(/\s+/g, " "))
  .pipe(z.string().min(ADMIN_REASON_MIN).max(ADMIN_REASON_MAX));

/** A plain EGP amount ("500", "12.5") → piastres; never a float. */
const positiveAmount = z
  .union([z.string(), z.number()])
  .transform((v) => asciiDigits(String(v)).trim().replace(/,/g, ""))
  .pipe(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/))
  .transform((v) => amountToPiastres(v));

/** A whole number typed in a form ("300", "٣٠٠"). An empty box is refused, never read as 0. */
const wholeNumber = z
  .union([z.string(), z.number()])
  .transform((v) => asciiDigits(String(v)).trim())
  .pipe(z.string().regex(/^\d{1,6}$/))
  .transform(Number);

/**
 * Admin › Tallaby Pay › Settings. The fee is snapshotted on each order when it
 * is placed, so a change here never touches a past order (design §4.4).
 */
export const tallabyPaySettingsInputSchema = z.object({
  feeBps: wholeNumber.pipe(z.number().int().min(0).max(TALLABY_PAY_MAX_FEE_BPS)),
  holdDays: wholeNumber.pipe(z.number().int().min(0).max(60)),
  /** EGP; at least EGP 1 (the column CHECK). */
  minPayout: positiveAmount.pipe(z.number().int().min(100)),
  live: z.boolean(),
  reason,
});
export type TallabyPaySettingsInput = z.output<typeof tallabyPaySettingsInputSchema>;

/**
 * An admin adjustment of a store's available earnings (owner Q8: the seller
 * pays chargeback fees). `direction` makes the sign explicit, so a typo can't
 * turn a charge into a credit. `key` is a fresh uuid per form, so a double
 * submit posts one entry.
 */
export const tallabyPayAdjustmentInputSchema = z.object({
  walletId: z.string().regex(UUID_RE),
  key: z.string().regex(UUID_RE),
  direction: z.enum(["credit", "debit"]),
  amount: positiveAmount.pipe(z.number().int().min(1).max(10_000_000)),
  reason,
});
export type TallabyPayAdjustmentInput = z.output<typeof tallabyPayAdjustmentInputSchema>;

/** The signed piastres an adjustment moves in `available`. */
export function adjustmentPiastres(input: Pick<TallabyPayAdjustmentInput, "direction" | "amount">): number {
  return input.direction === "debit" ? -input.amount : input.amount;
}

export const tallabyPayWalletNoteSchema = z.object({
  walletId: z.string().regex(UUID_RE),
  reason,
});

// ---------------------------------------------------------------------------
// Filters (from the URL; untrusted)
// ---------------------------------------------------------------------------

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** A `YYYY-MM-DD` that is a real calendar day, else null. */
export function parseAdminDay(value: unknown): string | null {
  if (typeof value !== "string" || !DAY_RE.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== value ? null : value;
}

export interface TallabyPayDateRange {
  /** Inclusive Cairo day, or null for no lower bound. */
  from: string | null;
  /** Inclusive Cairo day, or null for no upper bound. */
  to: string | null;
}

/** The date filter; a reversed range is swapped rather than refused. */
export function parseDateRange(input: { from?: unknown; to?: unknown }): TallabyPayDateRange {
  let from = parseAdminDay(input.from);
  let to = parseAdminDay(input.to);
  if (from && to && from > to) [from, to] = [to, from];
  return { from, to };
}

export const TALLABY_PAY_SALE_FILTERS = ["all", "pending", "available", "refunded", "refund_requested"] as const;
export type TallabyPaySaleFilter = (typeof TALLABY_PAY_SALE_FILTERS)[number];

export function parseSaleFilter(value: unknown): TallabyPaySaleFilter {
  return (TALLABY_PAY_SALE_FILTERS as readonly unknown[]).includes(value) ? (value as TallabyPaySaleFilter) : "all";
}

export const TALLABY_PAY_WALLET_FILTERS = ["all", "negative", "frozen", "has_money"] as const;
export type TallabyPayWalletFilter = (typeof TALLABY_PAY_WALLET_FILTERS)[number];

export function parseWalletFilter(value: unknown): TallabyPayWalletFilter {
  return (TALLABY_PAY_WALLET_FILTERS as readonly unknown[]).includes(value) ? (value as TallabyPayWalletFilter) : "all";
}

/** A 1-based page from the URL, capped so OFFSET stays small. */
export function parseAdminPage(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : NaN;
  return Number.isInteger(n) && n >= 1 && n <= 1000 ? n : 1;
}

/** A search box value: trimmed, at most 80 characters, or null. */
export function parseAdminSearch(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim().replace(/\s+/g, " ").slice(0, 80);
  return t.length ? t : null;
}

/** `%`, `_` and `\` matched literally inside an ILIKE pattern. */
export function likePattern(search: string): string {
  return `%${search.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

/** The sidebar badge: open withdrawals + refunds to make + identities to review. */
export function tallabyPayQueueCount(c: { openPayouts: number; refunds: number; kyc: number }): number {
  return [c.openPayouts, c.refunds, c.kyc].reduce((sum, n) => sum + (Number.isFinite(n) && n > 0 ? Math.trunc(n) : 0), 0);
}

export type TallabyPayDeclineBlock = "not_requested" | "already_refunded" | "must_refund";

/**
 * Why a refund request can't be declined, or null (design §8 "decline with a
 * reason"). Only an open request on a sale that wasn't refunded; never a
 * payment that arrived after the order was cancelled (`paid_after_cancel`):
 * that money belongs to the customer and must be refunded.
 */
export function tallabyPayDeclineBlock(s: {
  saleStatus: string;
  refundState: string | null;
  refundReason: string | null;
}): TallabyPayDeclineBlock | null {
  if (s.saleStatus === "refunded") return "already_refunded";
  if (s.saleStatus !== "pending" || s.refundState !== "requested") return "not_requested";
  if (s.refundReason === "paid_after_cancel") return "must_refund";
  return null;
}
