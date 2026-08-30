import { and, eq, isNull, or, sql } from "drizzle-orm";
import { coupons } from "../drizzle/schema";
import type { db as dbType } from "../drizzle/database";

type Tx = Parameters<Parameters<typeof dbType.transaction>[0]>[0];

/**
 * Atomically claims one use of a coupon: increments usageCount only if the
 * coupon still has room under usageLimit, in a single UPDATE ... RETURNING.
 *
 * Replaces the read `coupon.usageCount` -> write `usageCount + 1` pattern
 * (a check-then-act race: two concurrent checkouts can both read the same
 * usageCount and both succeed, exceeding usageLimit). Here the WHERE clause
 * re-checks the limit at write time, so only as many concurrent claims as
 * remain available can ever succeed.
 */
export async function claimCouponUsage(
  tx: Tx,
  couponId: string
): Promise<boolean> {
  const [row] = await tx
    .update(coupons)
    .set({ usageCount: sql`coalesce(${coupons.usageCount}, 0) + 1` })
    .where(
      and(
        eq(coupons.id, couponId),
        or(
          isNull(coupons.usageLimit),
          sql`coalesce(${coupons.usageCount}, 0) < ${coupons.usageLimit}`
        )
      )
    )
    .returning({ id: coupons.id });

  return Boolean(row);
}
