"use server";

import { db } from "@workspace/db";
import { reviews, reviewComments, products } from "@workspace/db";
import { eq, and, desc, sql, gte } from "drizzle-orm";
import { getUser } from "./auth";

export async function getSellerReviews(params?: {
  rating?: number;
  productId?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const conditions = [eq(reviews.sellerId, session.user.id)];
    
    if (params?.rating) {
      conditions.push(eq(reviews.rating, params.rating));
    }
    
    if (params?.productId) {
      conditions.push(eq(reviews.productId, params.productId));
    }

    const reviewsList = await db.query.reviews.findMany({
      where: and(...conditions),
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            email: true,
            avatar: true,
          },
        },
        product: {
          columns: {
            title: true,
            slug: true,
            images: true,
          },
        },
        reviewComments: {
          where: eq(reviewComments.sellerId, session.user.id),
          orderBy: [desc(reviewComments.createdAt)],
        },
        reviewVotes: true,
      },
      orderBy: [desc(reviews.createdAt)],
      limit: params?.limit || 20,
      offset: params?.offset || 0,
    });

    const totalCount = await db
      .select({ count: sql`count(*)` })
      .from(reviews)
      .where(and(...conditions));

    return { 
      success: true, 
      data: reviewsList,
      totalCount: Number(totalCount[0].count)
    };
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getProductReviews(productId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify product ownership
    const product = await db.query.products.findFirst({
      where: and(
        eq(products.id, productId),
        eq(products.sellerId, session.user.id)
      ),
    });

    if (!product) {
      throw new Error("Product not found or unauthorized");
    }

    const productReviews = await db.query.reviews.findMany({
      where: eq(reviews.productId, productId),
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        reviewComments: {
          where: eq(reviewComments.sellerId, session.user.id),
        },
      },
      orderBy: [desc(reviews.createdAt)],
    });

    return { success: true, data: productReviews };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function replyToReview(data: {
  reviewId: string;
  comment: string;
}) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    // Verify review is for seller's product
    const review = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.id, data.reviewId),
        eq(reviews.sellerId, session.user.id)
      ),
    });

    if (!review) {
      throw new Error("Review not found or unauthorized");
    }

    const newComment = await db
      .insert(reviewComments)
      .values({
        reviewId: data.reviewId,
        userId: session.user.id,
        sellerId: session.user.id,
        comment: data.comment,
        status: 'approved',
      })
      .returning();

    return { success: true, data: newComment[0] };
  } catch (error) {
    console.error("Error replying to review:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getReviewStats() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const stats = await db
      .select({
        rating: reviews.rating,
        count: sql<number>`count(*)`,
      })
      .from(reviews)
      .where(eq(reviews.sellerId, session.user.id))
      .groupBy(reviews.rating)
      .orderBy(reviews.rating);

    const aggregateStats = await db
      .select({
        totalReviews: sql<number>`count(*)`,
        averageRating: sql<number>`avg(${reviews.rating})`,
        repliedReviews: sql<number>`count(distinct ${reviewComments.reviewId})`,
      })
      .from(reviews)
      .leftJoin(
        reviewComments,
        and(
          eq(reviews.id, reviewComments.reviewId),
          eq(reviewComments.sellerId, session.user.id)
        )
      )
      .where(eq(reviews.sellerId, session.user.id));

    const recentReviews = await db.query.reviews.findMany({
      where: and(
        eq(reviews.sellerId, session.user.id),
        gte(reviews.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      ),
      limit: 10,
      orderBy: [desc(reviews.createdAt)],
    });

    return { 
      success: true, 
      data: {
        byRating: stats,
        aggregate: aggregateStats[0],
        recentCount: recentReviews.length,
      }
    };
  } catch (error) {
    console.error("Error fetching review stats:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getUnrepliedReviews() {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const unrepliedReviews = await db.query.reviews.findMany({
      where: and(
        eq(reviews.sellerId, session.user.id),
        sql`${reviews.id} NOT IN (
          SELECT DISTINCT review_id FROM ${reviewComments} 
          WHERE seller_id = ${session.user.id}
        )`
      ),
      with: {
        user: {
          columns: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        product: {
          columns: {
            title: true,
            slug: true,
          },
        },
      },
      orderBy: [desc(reviews.createdAt)],
      limit: 20,
    });

    return { success: true, data: unrepliedReviews };
  } catch (error) {
    console.error("Error fetching unreplied reviews:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function deleteReviewComment(commentId: string) {
  try {
    const session = await getUser();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const deleted = await db
      .delete(reviewComments)
      .where(
        and(
          eq(reviewComments.id, commentId),
          eq(reviewComments.sellerId, session.user.id)
        )
      )
      .returning();

    if (!deleted.length) {
      throw new Error("Comment not found or unauthorized");
    }

    return { success: true, data: deleted[0] };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}