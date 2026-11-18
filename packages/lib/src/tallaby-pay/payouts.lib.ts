/**
 * Tallaby Pay withdrawals and KYC, pure (ROADMAP.md F-100e; design §7 and the
 * owner's answers in §14: minimum EGP 500, KYC before the first withdrawal).
 *
 * Input schemas for the destination, the amount and the KYC form, and the
 * rules that decide whether a store may withdraw. payouts.server.ts applies
 * them under the wallet lock; the database (0175) stays the backstop. Money is
 * integer EGP piastres (CLAUDE.md rule 7); no floats.
 */
import { z } from "zod";

import { amountToPiastres } from "./fee.lib";

export const TALLABY_PAY_PAYOUT_METHODS = ["instapay", "bank", "mobile_wallet"] as const;
export type TallabyPayPayoutMethod = (typeof TALLABY_PAY_PAYOUT_METHODS)[number];

/** Egyptian mobile wallets (same keys as the store top-up wallets, 0142). */
export const TALLABY_PAY_WALLET_PROVIDERS = ["vodafone_cash", "e_cash", "orange_cash", "we_pay"] as const;
export type TallabyPayWalletProvider = (typeof TALLABY_PAY_WALLET_PROVIDERS)[number];

export const TALLABY_PAY_PAYOUT_STATUSES = ["requested", "paid", "rejected", "cancelled", "reversed"] as const;
export type TallabyPayPayoutStatus = (typeof TALLABY_PAY_PAYOUT_STATUSES)[number];

export const TALLABY_PAY_KYC_ID_TYPES = ["national_id", "commercial_register"] as const;
export type TallabyPayKycIdType = (typeof TALLABY_PAY_KYC_ID_TYPES)[number];
export type TallabyPayKycStatus = "submitted" | "verified" | "rejected";

const EG_MOBILE_RE = /^01[0125][0-9]{8}$/;
/** An InstaPay payment address (IPA), e.g. `name@instapay`. */
const INSTAPAY_ADDRESS_RE = /^[a-z0-9][a-z0-9._-]{1,63}@instapay$/;
/** An Egyptian IBAN is EG + 27 digits; a plain account number is 6–34 letters or digits. */
const EG_IBAN_RE = /^EG[0-9]{27}$/;
const ACCOUNT_RE = /^[A-Z0-9]{6,34}$/;

/** Arabic-Indic (٠–٩) and Persian (۰–۹) digits → ASCII, so a phone typed on an Arabic keyboard still parses. */
export function asciiDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}

/** `+20 101 234 5678` / `٠١٠١٢٣٤٥٦٧٨` → `01012345678`. */
export function normalizeTallabyPayPhone(input: string): string {
  const digits = asciiDigits(input).replace(/[^\d+]/g, "");
  if (digits.startsWith("+20")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  return digits;
}

const collapse = (s: string) => s.trim().replace(/\s+/g, " ");

const holderName = z.string().transform(collapse).pipe(z.string().min(2).max(200));
const egPhone = z.string().max(40).transform(normalizeTallabyPayPhone).pipe(z.string().regex(EG_MOBILE_RE));

export const tallabyPayDestinationSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("instapay"),
    holderName,
    /** An InstaPay address or the phone linked to InstaPay. */
    address: z
      .string()
      .max(80)
      .transform((s) => {
        const t = asciiDigits(s).trim().toLowerCase();
        return t.includes("@") ? t : normalizeTallabyPayPhone(t);
      })
      .pipe(z.string().refine((v) => INSTAPAY_ADDRESS_RE.test(v) || EG_MOBILE_RE.test(v))),
  }),
  z.object({
    method: z.literal("bank"),
    holderName,
    bankName: z.string().transform(collapse).pipe(z.string().min(2).max(100)),
    /** IBAN (EG + 27 digits) or the account number. */
    accountNumber: z
      .string()
      .max(60)
      .transform((s) => asciiDigits(s).replace(/[\s-]+/g, "").toUpperCase())
      .pipe(z.string().refine((v) => (v.startsWith("EG") ? EG_IBAN_RE.test(v) : ACCOUNT_RE.test(v)))),
  }),
  z.object({
    method: z.literal("mobile_wallet"),
    holderName,
    provider: z.enum(TALLABY_PAY_WALLET_PROVIDERS),
    phone: egPhone,
  }),
]);
export type TallabyPayDestination = z.output<typeof tallabyPayDestinationSchema>;

/** An EGP amount typed by the seller ("500", "500.5", "1250.75") → piastres. Strings only: no float parsing. */
const amountSchema = z
  .union([z.string(), z.number().int().nonnegative()])
  .transform((v) => asciiDigits(String(v)).trim().replace(/,/g, ""))
  .pipe(z.string().regex(/^\d{1,8}(\.\d{1,2})?$/))
  .transform((v) => amountToPiastres(v));

/**
 * The seller's withdrawal form. `amount` is optional: missing means the whole
 * withdrawable amount (design §7). The store and seller never come from here.
 */
export const tallabyPayPayoutRequestSchema = z.object({
  amount: amountSchema.optional(),
  destination: tallabyPayDestinationSchema,
});
export type TallabyPayPayoutRequest = z.output<typeof tallabyPayPayoutRequestSchema>;

/** A valid Egyptian national ID: 14 digits, century digit 2 or 3, then a real month and day. */
export function isEgyptianNationalId(id: string): boolean {
  if (!/^[23][0-9]{13}$/.test(id)) return false;
  const month = Number(id.slice(3, 5));
  const day = Number(id.slice(5, 7));
  return month >= 1 && month <= 12 && day >= 1 && day <= 31;
}

export const tallabyPayKycSchema = z
  .object({
    legalName: z.string().transform(collapse).pipe(z.string().min(2).max(200)),
    idType: z.enum(TALLABY_PAY_KYC_ID_TYPES),
    idNumber: z.string().max(80).transform((s) => asciiDigits(s).trim()),
  })
  .transform((v, ctx) => {
    if (v.idType === "national_id") {
      const id = v.idNumber.replace(/[\s-]+/g, "");
      if (!isEgyptianNationalId(id)) {
        ctx.addIssue({ code: "custom", path: ["idNumber"], message: "invalid national id" });
        return z.NEVER;
      }
      return { ...v, idNumber: id };
    }
    const reg = collapse(v.idNumber);
    if (!/^[A-Za-z0-9؀-ۿ][A-Za-z0-9؀-ۿ /-]{0,39}$/.test(reg)) {
      ctx.addIssue({ code: "custom", path: ["idNumber"], message: "invalid commercial register" });
      return z.NEVER;
    }
    return { ...v, idNumber: reg };
  });
export type TallabyPayKycInput = z.output<typeof tallabyPayKycSchema>;

/**
 * A name for comparison: case, spaces, Arabic diacritics and tatweel ignored,
 * and the common letter variants (أ إ آ → ا, ى → ي, ة → ه) folded.
 */
export function normalizeLegalName(name: string): string {
  return name
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ً-ٰٟـ]/g, "")
    .replace(/[آأإ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** The destination must be in the account's verified legal name (owner 2026-11-18, Q6). */
export function holderMatchesLegalName(holder: string, legalName: string): boolean {
  const a = normalizeLegalName(holder);
  return a.length > 0 && a === normalizeLegalName(legalName);
}

export type TallabyPayWithdrawBlock =
  | "kyc_required"
  | "kyc_pending"
  | "kyc_rejected"
  | "name_mismatch"
  | "frozen"
  | "no_balance"
  | "open_request"
  | "below_minimum"
  | "above_withdrawable";

export interface TallabyPayWithdrawState {
  /** Piastres; may be negative after a refund. */
  available: number;
  reserved: number;
  walletStatus: "active" | "frozen" | string;
  kycStatus: TallabyPayKycStatus | null;
  hasOpenRequest: boolean;
  minPayoutPiastres: number;
}

/** What the seller may withdraw now: available − reserved, never below zero. */
export function tallabyPayWithdrawable(available: number, reserved: number): number {
  return Math.max(0, available - reserved);
}

/** Why the store can't open a withdrawal at all, before any amount is chosen. */
export function tallabyPayWithdrawBlock(state: TallabyPayWithdrawState): TallabyPayWithdrawBlock | null {
  if (state.kycStatus === null) return "kyc_required";
  if (state.kycStatus === "submitted") return "kyc_pending";
  if (state.kycStatus !== "verified") return "kyc_rejected";
  if (state.walletStatus !== "active") return "frozen";
  if (state.hasOpenRequest) return "open_request";
  if (state.available <= 0) return "no_balance";
  if (tallabyPayWithdrawable(state.available, state.reserved) < state.minPayoutPiastres) return "below_minimum";
  return null;
}

/**
 * The amount to withdraw, or why not. `requested` undefined = the whole
 * withdrawable amount. Integer piastres in, integer piastres out.
 */
export function resolveTallabyPayPayoutAmount(
  state: TallabyPayWithdrawState,
  requested: number | undefined,
): { ok: true; amount: number } | { ok: false; error: TallabyPayWithdrawBlock } {
  const block = tallabyPayWithdrawBlock(state);
  if (block) return { ok: false, error: block };
  const withdrawable = tallabyPayWithdrawable(state.available, state.reserved);
  const amount = requested ?? withdrawable;
  if (!Number.isSafeInteger(amount) || amount < state.minPayoutPiastres) return { ok: false, error: "below_minimum" };
  if (amount > withdrawable) return { ok: false, error: "above_withdrawable" };
  return { ok: true, amount };
}

const maskTail = (value: string, keep = 4) => `${"•".repeat(Math.max(value.length - keep, 0))}${value.slice(-keep)}`;

/** What a list may show: method, holder and the last digits. The full destination stays server-side (admins pay from it). */
export function maskTallabyPayDestination(d: TallabyPayDestination): string {
  switch (d.method) {
    case "instapay":
      return d.address.includes("@") ? `${d.address.slice(0, 2)}•••@instapay` : maskTail(d.address);
    case "bank":
      return `${d.bankName} •••• ${d.accountNumber.slice(-4)}`;
    case "mobile_wallet":
      return maskTail(d.phone);
  }
}
