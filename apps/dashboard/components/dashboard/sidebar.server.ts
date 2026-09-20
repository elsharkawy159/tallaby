"use server";

import { db } from "@workspace/db";
import {
  orderItems,
  products,
  reviews,
  coupons,
  sellerPayouts,
  shipments,
} from "@workspace/db";
import { and, eq, inArray, sql } from "drizzle-orm";
import { getUser } from "@/actions/auth";
import {
  EMPTY_SIDEBAR_COUNTS,
  type SidebarCounts,
} from "./sidebar.types";

export async function getSidebarCounts(): Promise<SidebarCounts> {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      return EMPTY_SIDEBAR_COUNTS;
    }

    const sellerId = session.user.id;

    const [
      orderCountResult,
      productCountResult,
      reviewCountResult,
      couponCountResult,
      payoutCountResult,
      shippingCountResult,
    ] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(orderItems)
        .where(eq(orderItems.sellerId, sellerId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(eq(products.sellerId, sellerId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(reviews)
        .where(eq(reviews.sellerId, sellerId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(coupons)
        .where(eq(coupons.sellerId, sellerId)),
      db
        .select({ count: sql<number>`count(*)` })
        .from(sellerPayouts)
        .where(eq(sellerPayouts.sellerId, sellerId)),
      // Deliveries the seller still has to see through (rider assigned or on the road).
      db
        .select({ count: sql<number>`count(*)` })
        .from(shipments)
        .where(
          and(
            eq(shipments.sellerId, sellerId),
            inArray(shipments.status, ["assigned", "out_for_delivery"])
          )
        ),
    ]);

    const orderCount = Number(orderCountResult[0]?.count ?? 0);

    return {
      dashboard: orderCount,
      orders: orderCount,
      shipping: Number(shippingCountResult[0]?.count ?? 0),
      products: Number(productCountResult[0]?.count ?? 0),
      reviews: Number(reviewCountResult[0]?.count ?? 0),
      promotions: Number(couponCountResult[0]?.count ?? 0),
      marketing: 0,
      financial: Number(payoutCountResult[0]?.count ?? 0),
    };
  } catch (error) {
    console.error("Error fetching sidebar counts:", error);
    return EMPTY_SIDEBAR_COUNTS;
  }
}
