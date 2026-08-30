import { and, eq, sql } from "drizzle-orm";

import { db } from "../drizzle/database";
import { products, reviews, sellers } from "../drizzle/schema";

export async function syncProductRating(productId: string): Promise<void> {
  const [aggregate] = await db
    .select({
      count: sql<number>`count(*)`,
      average: sql<number>`avg(${reviews.rating})`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.productId, productId),
        eq(reviews.status, "approved"),
        eq(reviews.reviewType, "product")
      )
    );

  const reviewCount = Number(aggregate?.count ?? 0);
  const averageRating =
    reviewCount > 0 && aggregate?.average != null
      ? Number(aggregate.average)
      : null;

  await db
    .update(products)
    .set({
      reviewCount,
      averageRating,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(products.id, productId));
}

export async function syncSellerRating(sellerId: string): Promise<void> {
  const [aggregate] = await db
    .select({
      count: sql<number>`count(*)`,
      average: sql<number>`avg(${reviews.rating})`,
      positiveCount: sql<number>`count(*) filter (where ${reviews.rating} >= 4)`,
    })
    .from(reviews)
    .where(
      and(
        eq(reviews.sellerId, sellerId),
        eq(reviews.status, "approved"),
        eq(reviews.reviewType, "store")
      )
    );

  const totalRatings = Number(aggregate?.count ?? 0);
  const storeRating =
    totalRatings > 0 && aggregate?.average != null
      ? Number(aggregate.average)
      : null;
  const positiveCount = Number(aggregate?.positiveCount ?? 0);
  const positiveRatingPercent =
    totalRatings > 0 ? (positiveCount / totalRatings) * 100 : null;

  await db
    .update(sellers)
    .set({
      storeRating,
      totalRatings,
      positiveRatingPercent: positiveRatingPercent,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(sellers.id, sellerId));
}
