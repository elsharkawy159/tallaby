"use server";

import { db } from "@workspace/db";
import { coupons, couponUsage } from "@workspace/db";
import { eq, and, desc, sql, gte, lte, gt, lt } from "drizzle-orm";
import { getUser } from "./auth";

export async function getSellerCoupons(params?: {
  isActive?: boolean;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const conditions = [eq(coupons.sellerId, session.user.id)];
    
    if (params?.isActive !== undefined) {
      conditions.push(eq(coupons.isActive, params.isActive));
    }

    const couponList = await db.query.coupons.findMany({
      where: and(...conditions),
      with: {
        couponUsages: {
          limit: 5,
          orderBy: [desc(couponUsage.createdAt)],
        },
      },
      orderBy: [desc(coupons.createdAt)],
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(coupons)
      .where(and(...conditions));

    return { 
      success: true, 
      data: couponList,
      totalCount: Number(totalCount[0].count)
    };
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getActiveCoupons() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const now = new Date().toISOString();

    const activeCoupons = await db.query.coupons.findMany({
      where: and(
        eq(coupons.sellerId, session.user.id),
        eq(coupons.isActive, true),
        lte(coupons.startsAt, now),
        gte(coupons.expiresAt, now)
      ),
      orderBy: [desc(coupons.createdAt)],
    });

    return { success: true, data: activeCoupons };
  } catch (error) {
    console.error("Error fetching active coupons:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getCouponDetails(couponId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.id, couponId),
        eq(coupons.sellerId, session.user.id)
      ),
      with: {
        couponUsages: {
          with: {
            order: {
              columns: {
                orderNumber: true,
                totalAmount: true,
              },
            },
            user: {
              columns: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: [desc(couponUsage.createdAt)],
        },
      },
    });

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    return { success: true, data: coupon };
  } catch (error) {
    console.error("Error fetching coupon details:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function createCoupon(data: {
  code: string;
  name: string;
  description?: string;
  discountType: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  discountValue: string;
  minimumPurchase?: string;
  maximumDiscount?: string;
  usageLimit?: number;
  perUserLimit?: number;
  startsAt: string;
  expiresAt: string;
  applicableTo?: any;
  excludeItems?: any;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const newCoupon = await db
      .insert(coupons)
      .values({
        ...data,
        sellerId: session.user.id,
        isActive: true,
        usageCount: 0,
      })
      .returning();

    return { success: true, data: newCoupon[0] };
  } catch (error) {
    console.error("Error creating coupon:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function updateCoupon(couponId: string, data: Partial<typeof coupons.$inferInsert>) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const updatedCoupon = await db
      .update(coupons)
      .set({
        ...data,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(coupons.id, couponId),
          eq(coupons.sellerId, session.user.id)
        )
      )
      .returning();

    if (!updatedCoupon.length) {
      throw new Error("Coupon not found or unauthorized");
    }

    return { success: true, data: updatedCoupon[0] };
  } catch (error) {
    console.error("Error updating coupon:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function toggleCouponStatus(couponId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const coupon = await db.query.coupons.findFirst({
      where: and(
        eq(coupons.id, couponId),
        eq(coupons.sellerId, session.user.id)
      ),
    });

    if (!coupon) {
      throw new Error("Coupon not found");
    }

    const updatedCoupon = await db
      .update(coupons)
      .set({
        isActive: !coupon.isActive,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(coupons.id, couponId))
      .returning();

    return { success: true, data: updatedCoupon[0] };
  } catch (error) {
    console.error("Error toggling coupon status:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteCoupon(couponId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Check if coupon has been used
    const usage = await db.query.couponUsage.findFirst({
      where: eq(couponUsage.couponId, couponId),
    });

    if (usage) {
      // If used, just deactivate instead of delete
      return updateCoupon(couponId, { isActive: false });
    }

    const deleted = await db
      .delete(coupons)
      .where(
        and(
          eq(coupons.id, couponId),
          eq(coupons.sellerId, session.user.id)
        )
      )
      .returning();

    if (!deleted.length) {
      throw new Error("Coupon not found or unauthorized");
    }

    return { success: true, data: deleted[0] };
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getCouponStats() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const stats = await db
      .select({
        totalCoupons: sql<number>`count(distinct ${coupons.id})`,
        activeCoupons: sql<number>`count(distinct ${coupons.id}) filter (where ${coupons.isActive} = true)`,
        totalUsage: sql<number>`sum(${coupons.usageCount})`,
        totalDiscountGiven: sql<number>`coalesce(sum(${couponUsage.discountAmount}), 0)`,
      })
      .from(coupons)
      .leftJoin(couponUsage, eq(coupons.id, couponUsage.couponId))
      .where(eq(coupons.sellerId, session.user.id));

    return { success: true, data: stats[0] };
  } catch (error) {
    console.error("Error fetching coupon stats:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}