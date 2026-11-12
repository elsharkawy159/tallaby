/**
 * Pure rules for the Tallaby affiliate program (ROADMAP.md F-37, 0117).
 * No DB imports, safe on the client.
 *
 * A seller shares `tallaby.com/?ref=<code>`. Since 2026-11-12 (owner) every
 * seller who signs up through it earns the referrer EGP 100 once, when their
 * succeeded store-wallet top-ups first add up to $5 or more (0168). The older
 * program, 25 % of each succeeded top-up, stays in code behind
 * `REFERRAL_PROGRAM` and earns nothing while it is off. Paid in cash by an
 * admin. Its own ledger: no wallet balance ever changes.
 * Money is integer piastres (EGP) or cents (USD) here; the DB stores numeric(10,2).
 */
import { z } from "zod";

// Self-contained (no ../fulfillment import): the proxies bundle this file.
const EG_MOBILE_RE = /^01[0125][0-9]{8}$/;

/** `+20 101 234 5678` / `0101-234-5678` → `01012345678` (same rule as sellers/signup.lib). */
export function normalizeEgyptianPhone(input: string): string {
  const digits = input.replace(/[^\d+]/g, "");
  if (digits.startsWith("+20")) return `0${digits.slice(3)}`;
  if (digits.startsWith("0020")) return `0${digits.slice(4)}`;
  return digits;
}

export type ReferralProgram = "percent" | "signup_bonus";
/**
 * The live program (owner, 2026-11-12): `signup_bonus`. Set it back to
 * `percent` to pay REFERRAL_RATE_PERCENT of every top-up again.
 */
export const REFERRAL_PROGRAM: ReferralProgram = "signup_bonus";

/** The dormant percent program's rate (25 % since 2026-11-12, 20 % before). */
export const REFERRAL_RATE_PERCENT = 25;
/** EGP 100 per referred seller account, once (owner, 2026-11-12). */
export const REFERRAL_SIGNUP_BONUS_PIASTRES = 10_000;
/** $5 of succeeded top-ups earns the bonus. */
export const REFERRAL_SIGNUP_BONUS_THRESHOLD_USD_CENTS = 500;
/** EGP 500, the smallest withdrawal (owner, 2026-10-29). No referral count is needed since 2026-11-12. */
export const REFERRAL_MIN_PAYOUT_PIASTRES = 50_000;

export const REFERRAL_COOKIE = "tallaby_ref";
/** 60 days, in seconds. */
export const REFERRAL_COOKIE_MAX_AGE = 60 * 24 * 60 * 60;

/** 7 characters without the look-alikes I, O, 0 and 1. */
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
export const REFERRAL_CODE_RE = /^[A-HJ-NP-Z2-9]{7}$/;

export function toPiastres(amount: string | number): number {
  return Math.round(Number(amount) * 100);
}

export function fromPiastres(piastres: number): string {
  const sign = piastres < 0 ? "-" : "";
  const abs = Math.abs(piastres);
  return `${sign}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

/** 25 % of a top-up, rounded down to the piastre (the dormant percent program). */
export function commissionPiastres(topUpAmount: string): number {
  return Math.floor((toPiastres(topUpAmount) * REFERRAL_RATE_PERCENT) / 100);
}

/**
 * Earned (not reversed) minus payouts that are requested or paid. A rejected
 * payout drops out, so its money comes back; a reversal after a payout can go
 * negative, and later commissions pay it off first.
 */
export function availablePiastres(input: { earned: number; requestedOrPaid: number }): number {
  return input.earned - input.requestedOrPaid;
}

/**
 * Succeeded top-ups in US cents: the USD the wallet received, plus EGP-credited
 * top-ups from before the USD switch at the switch rate
 * (`billing_settings.conversion_rate`). Null when EGP credits exist but there
 * is no rate to measure them, so no bonus is guessed.
 */
export function topUpsUsdCents(input: { usdCredited: string; egpCredited: string; rate: number | null }): number | null {
  const usdCents = toPiastres(input.usdCredited);
  const egpPiastres = toPiastres(input.egpCredited);
  if (egpPiastres === 0) return usdCents;
  if (!input.rate || !(input.rate > 0)) return null;
  return usdCents + Math.round((egpPiastres * 10_000) / Math.round(input.rate * 10_000));
}

/** Whether this top-up takes the seller's total from below $5 to $5 or more. */
export function signupBonusCrossed(input: { beforeUsdCents: number; thisUsdCents: number }): boolean {
  return (
    input.beforeUsdCents < REFERRAL_SIGNUP_BONUS_THRESHOLD_USD_CENTS &&
    input.beforeUsdCents + input.thisUsdCents >= REFERRAL_SIGNUP_BONUS_THRESHOLD_USD_CENTS
  );
}

/** Why a withdrawal is blocked. The 10 referrals + 10 stores unlock ended on 2026-11-12 (owner). */
export type WithdrawBlockReason = "suspended" | "open_request" | "below_minimum";

export function withdrawBlockReason(input: {
  available: number;
  hasOpenRequest: boolean;
  sellerStatus: string;
}): WithdrawBlockReason | null {
  if (input.sellerStatus !== "approved") return "suspended";
  if (input.hasOpenRequest) return "open_request";
  if (input.available < REFERRAL_MIN_PAYOUT_PIASTRES) return "below_minimum";
  return null;
}

export function normalizeReferralCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const code = raw.trim().toUpperCase();
  return REFERRAL_CODE_RE.test(code) ? code : null;
}

export function generateReferralCode(random: () => number = Math.random): string {
  let code = "";
  for (let i = 0; i < 7; i++) code += CODE_ALPHABET[Math.floor(random() * CODE_ALPHABET.length)];
  return code;
}

/** The code the proxy should store, or null. The first valid link wins. */
export function referralCookieToSet(searchRef: string | null | undefined, existingCookie: string | null | undefined): string | null {
  const code = normalizeReferralCode(searchRef);
  if (!code) return null;
  if (normalizeReferralCode(existingCookie)) return null;
  return code;
}

/**
 * Cookie options for `tallaby_ref`. `domain` (REFERRAL_COOKIE_DOMAIN, e.g.
 * `.tallaby.com`) shares it between tallaby.com and dashboard.tallaby.com;
 * unset means host-only (local development).
 */
export function referralCookieOptions(domain?: string | null) {
  return {
    path: "/",
    maxAge: REFERRAL_COOKIE_MAX_AGE,
    sameSite: "lax" as const,
    httpOnly: true,
    secure: Boolean(domain),
    ...(domain ? { domain } : {}),
  };
}

export function referralShareUrl(code: string, base = "https://tallaby.com"): string {
  return `${base.replace(/\/$/, "")}/?ref=${encodeURIComponent(code)}`;
}

const holderName = z.string().trim().min(2).max(100);

export const payoutRequestSchema = z.discriminatedUnion("method", [
  z.object({
    method: z.literal("bank"),
    holderName,
    bankName: z.string().trim().min(2).max(100),
    accountNumber: z
      .string()
      .transform((s) => s.replace(/\s+/g, "").toUpperCase())
      .pipe(z.string().regex(/^[A-Z0-9]{6,34}$/)),
  }),
  z.object({
    method: z.literal("vodafone_cash"),
    holderName,
    phone: z.string().transform(normalizeEgyptianPhone).pipe(z.string().regex(EG_MOBILE_RE)),
  }),
]);
export type PayoutDestination = z.output<typeof payoutRequestSchema>;
export type PayoutMethod = PayoutDestination["method"];

export function maskDestination(d: PayoutDestination): string {
  if (d.method === "vodafone_cash") return `${"•".repeat(Math.max(d.phone.length - 4, 0))}${d.phone.slice(-4)}`;
  return `${d.bankName} •••• ${d.accountNumber.slice(-4)}`;
}
