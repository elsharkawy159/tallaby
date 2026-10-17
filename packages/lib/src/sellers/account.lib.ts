/**
 * Seller ACCOUNT data edited on /settings › Business & account (PLAN.md §7.3,
 * P3-05): business identity, legal address and the preferred payout account.
 * Store-level fields (logo, policies, contact shown in the store) live on the
 * store. Pure; no DB imports.
 *
 * Payout details are the seller's preferred destination; admin records the
 * actual destination on each payout (seller_payouts.destination_account).
 * They are never logged and only shown masked (last 4).
 */
import { z } from "zod";
import { EGYPT_MOBILE_REGEX, governorateSchema } from "../fulfillment";

export const BUSINESS_TYPES = ["individual", "company", "partnership", "corporation"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const businessAccountSchema = z
  .object({
    businessName: z.string().trim().min(2).max(120),
    businessType: z.enum(BUSINESS_TYPES).optional(),
  })
  .strict();

export const sellerLegalAddressSchema = z
  .object({
    street: z.string().trim().min(5, "street_required").max(200, "too_long"),
    city: z.string().trim().min(2, "city_required").max(100, "too_long"),
    state: governorateSchema,
    postalCode: z.string().trim().max(20, "too_long").optional(),
    country: z.literal("EG"),
  })
  .strict();
export type SellerLegalAddress = z.output<typeof sellerLegalAddressSchema>;

const holder = z.string().trim().min(2).max(120);
const egyptianMobile = z
  .string()
  .transform((v) => v.replace(/[\s-]/g, ""))
  .pipe(z.string().regex(EGYPT_MOBILE_REGEX, "phone_invalid"));

export const MOBILE_WALLET_PROVIDERS = ["vodafone_cash", "etisalat_cash", "orange_cash", "we_pay"] as const;

export const payoutDetailsSchema = z.discriminatedUnion("method", [
  z
    .object({
      method: z.literal("bank_transfer"),
      accountHolder: holder,
      bankName: z.string().trim().min(2).max(80),
      // Egyptian IBAN: EG + 27 digits.
      iban: z
        .string()
        .transform((v) => v.replace(/\s+/g, "").toUpperCase())
        .pipe(z.string().regex(/^EG\d{27}$/, "iban_invalid")),
    })
    .strict(),
  z
    .object({
      method: z.literal("mobile_wallet"),
      accountHolder: holder,
      provider: z.enum(MOBILE_WALLET_PROVIDERS),
      phone: egyptianMobile,
    })
    .strict(),
  z
    .object({
      method: z.literal("instapay"),
      accountHolder: holder,
      // An InstaPay address (name@instapay) or the linked mobile number.
      address: z
        .string()
        .trim()
        .refine((v) => /^[a-z0-9._-]{2,60}@instapay$/i.test(v) || EGYPT_MOBILE_REGEX.test(v.replace(/[\s-]/g, "")), "instapay_invalid"),
    })
    .strict(),
]);
export type PayoutDetails = z.output<typeof payoutDetailsSchema>;
export type PayoutMethod = PayoutDetails["method"];

export type MaskedPayoutDetails =
  | { method: "bank_transfer"; accountHolder: string; bankName: string; last4: string }
  | { method: "mobile_wallet"; accountHolder: string; provider: string; last4: string }
  | { method: "instapay"; accountHolder: string; last4: string };

/** What the browser may see of stored payout details. Invalid/legacy data → null. */
export function maskPayoutDetails(stored: unknown): MaskedPayoutDetails | null {
  const parsed = payoutDetailsSchema.safeParse(stored);
  if (!parsed.success) return null;
  const d = parsed.data;
  if (d.method === "bank_transfer") {
    return { method: d.method, accountHolder: d.accountHolder, bankName: d.bankName, last4: d.iban.slice(-4) };
  }
  if (d.method === "mobile_wallet") {
    return { method: d.method, accountHolder: d.accountHolder, provider: d.provider, last4: d.phone.slice(-4) };
  }
  return { method: d.method, accountHolder: d.accountHolder, last4: d.address.slice(-4) };
}
