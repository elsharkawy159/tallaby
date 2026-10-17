/**
 * Seller account updates for /settings › Business & account (P3-05).
 * Server-only. The sellerId comes from the session (callers use requireSeller).
 * Payout details are stored as given (validated) and never returned in full.
 */
import { db, eq, sellers, sql } from "@workspace/db";
import {
  businessAccountSchema,
  maskPayoutDetails,
  payoutDetailsSchema,
  sellerLegalAddressSchema,
  type BusinessType,
  type MaskedPayoutDetails,
  type SellerLegalAddress,
} from "./account.lib";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Queryable = Tx | typeof db;

export type AccountResult = { success: true } | { success: false; error: "invalid_input" | "not_found" };

export type SellerAccountView = {
  businessName: string;
  businessType: BusinessType | null;
  legalAddress: Partial<SellerLegalAddress>;
  payout: MaskedPayoutDetails | null;
};

export async function getSellerAccountView(sellerId: string, q: Queryable = db): Promise<SellerAccountView | null> {
  const [row] = await q
    .select({
      businessName: sellers.businessName,
      businessType: sellers.businessType,
      legalAddress: sellers.legalAddress,
      paymentDetails: sellers.paymentDetails,
    })
    .from(sellers)
    .where(eq(sellers.id, sellerId))
    .limit(1);
  if (!row) return null;
  const type = row.businessType as BusinessType;
  // Stored with an updatedAt stamp; the strict schema behind the mask must not see it.
  const { updatedAt: _updatedAt, ...payout } = (row.paymentDetails ?? {}) as Record<string, unknown>;
  return {
    businessName: row.businessName,
    businessType: ["individual", "company", "partnership", "corporation"].includes(type) ? type : null,
    legalAddress: (row.legalAddress ?? {}) as Partial<SellerLegalAddress>,
    payout: maskPayoutDetails(payout),
  };
}

/** Business type + legal address (one form). */
export async function updateSellerLegalDetails(
  sellerId: string,
  input: { businessType?: unknown; legalAddress: unknown },
  q: Queryable = db,
): Promise<AccountResult> {
  const address = sellerLegalAddressSchema.safeParse(input.legalAddress);
  const business = businessAccountSchema.pick({ businessType: true }).safeParse({ businessType: input.businessType });
  if (!address.success || !business.success) return { success: false, error: "invalid_input" };

  const updated = await q
    .update(sellers)
    .set({
      legalAddress: address.data,
      ...(business.data.businessType && { businessType: business.data.businessType }),
      updatedAt: sql`now()`,
    })
    .where(eq(sellers.id, sellerId))
    .returning({ id: sellers.id });
  return updated.length ? { success: true } : { success: false, error: "not_found" };
}

/** The seller's preferred payout account. Replaces the previous one. */
export async function updateSellerPayoutDetails(
  sellerId: string,
  input: unknown,
  q: Queryable = db,
): Promise<AccountResult> {
  const parsed = payoutDetailsSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: "invalid_input" };
  const updated = await q
    .update(sellers)
    .set({
      paymentDetails: { ...parsed.data, updatedAt: new Date().toISOString() },
      updatedAt: sql`now()`,
    })
    .where(eq(sellers.id, sellerId))
    .returning({ id: sellers.id });
  return updated.length ? { success: true } : { success: false, error: "not_found" };
}
