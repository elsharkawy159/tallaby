import { eq } from "drizzle-orm";

import type { db as dbType } from "../drizzle/database";
import { affiliates, coupons } from "../drizzle/schema";
import { buildAffiliateCodeCandidate } from "./code";
import {
  AFFILIATE_DISCOUNT_PERCENT,
  buildAffiliateCouponExpiry,
} from "./constants";

/** Anything that can run a query or open a transaction: the pooled db, or an open tx (re-entrant transactions collapse to the same connection in postgres-js/drizzle). */
type Queryable = typeof dbType;

const PG_UNIQUE_VIOLATION = "23505";

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === PG_UNIQUE_VIOLATION
  );
}

export interface AffiliateAccount {
  affiliateId: string;
  couponId: string;
  code: string;
  status: "active" | "inactive";
}

const MAX_CODE_ATTEMPTS = 8;

class CodeCollisionError extends Error {}

/** Reads the caller's existing affiliate account, if any. Read-only — never creates one. */
export async function getAffiliateAccount(
  db: Queryable,
  userId: string
): Promise<AffiliateAccount | null> {
  const existing = await db.query.affiliates.findFirst({
    where: eq(affiliates.userId, userId),
    with: { coupon: { columns: { code: true } } },
  });
  if (!existing) return null;

  return {
    affiliateId: existing.id,
    couponId: existing.couponId,
    code: existing.coupon.code,
    status: existing.status,
  };
}

/**
 * Creates the caller's permanent affiliate coupon + affiliate account.
 *
 * Idempotent: a user who is already an affiliate gets their existing account
 * back rather than a second one — "prevent the same user from creating
 * multiple affiliate accounts/codes" is enforced by returning early on a
 * pre-check, and again by the database's unique constraints on
 * affiliates.user_id / affiliates.coupon_id if two requests race.
 *
 * Retries on a coupon-code collision (astronomically unlikely given the
 * random suffix, but the retry makes the guarantee actual rather than
 * probabilistic) up to MAX_CODE_ATTEMPTS times.
 */
export async function joinAffiliateProgram(
  db: Queryable,
  input: { userId: string; fullName: string | null | undefined }
): Promise<AffiliateAccount> {
  const existing = await getAffiliateAccount(db, input.userId);
  if (existing) return existing;

  for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
    const code = buildAffiliateCodeCandidate(input.fullName);

    try {
      return await db.transaction(async (tx) => {
        const [coupon] = await tx
          .insert(coupons)
          .values({
            code,
            name: `Affiliate code — ${code}`,
            description:
              "Tallaby affiliate promo code. 10% off for the customer, reusable across orders.",
            discountType: "percentage",
            discountValue: String(AFFILIATE_DISCOUNT_PERCENT),
            isActive: true,
            isOneTimeUse: false,
            usageLimit: null,
            perUserLimit: null,
            startsAt: new Date().toISOString(),
            expiresAt: buildAffiliateCouponExpiry(),
          })
          .onConflictDoNothing({ target: coupons.code })
          .returning({ id: coupons.id, code: coupons.code });

        if (!coupon) throw new CodeCollisionError();

        const [affiliate] = await tx
          .insert(affiliates)
          .values({ userId: input.userId, couponId: coupon.id })
          .returning({ id: affiliates.id, status: affiliates.status });

        if (!affiliate) throw new Error("Affiliate insert returned no row");

        return {
          affiliateId: affiliate.id,
          couponId: coupon.id,
          code: coupon.code,
          status: affiliate.status,
        };
      });
    } catch (error) {
      if (error instanceof CodeCollisionError) continue;

      // A concurrent request for the same user won the race — return its
      // result instead of erroring, keeping this function idempotent under
      // a double-submit.
      if (isUniqueViolation(error)) {
        const winner = await getAffiliateAccount(db, input.userId);
        if (winner) return winner;
      }

      throw error;
    }
  }

  throw new Error("Failed to generate a unique affiliate code");
}
