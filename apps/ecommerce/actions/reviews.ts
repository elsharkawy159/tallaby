"use server";

import { db, eq, and, desc } from "@workspace/db";
import { reviews, reviewVotes, reviewComments, orderItems, orders } from "@workspace/db";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Schema for creating a review
const createReviewSchema = z.object({
  orderId: z.string().uuid(),
  orderItemId: z.string().uuid(),
  productId: z.string().uuid(),
  sellerId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
  isAnonymous: z.boolean().default(false),
});

const createStoreReviewSchema = z.object({
  orderId: z.string().uuid(),
  sellerId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  isAnonymous: z.boolean().default(false),
});

const updateReviewSchema = z.object({
  reviewId: z.string().uuid(),
  rating: z.number().min(1).max(5),
  title: z.string().optional(),
  comment: z.string().optional(),
  images: z.array(z.string()).optional(),
  isAnonymous: z.boolean().optional(),
});

// Schema for voting on a review
const voteReviewSchema = z.object({
  reviewId: z.string().uuid(),
  isHelpful: z.boolean(),
});

// Schema for commenting on a review
const createReviewCommentSchema = z.object({
  reviewId: z.string().uuid(),
  comment: z.string().min(1, "Comment cannot be empty"),
  isAnonymous: z.boolean().default(false),
});

export async function createReview(data: z.infer<typeof createReviewSchema>) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    // Validate input
    const validatedData = createReviewSchema.parse(data);

    // Verify the order item belongs to the user and order is delivered
    const orderItem = await db.query.orderItems.findFirst({
      where: and(
        eq(orderItems.id, validatedData.orderItemId),
        eq(orderItems.orderId, validatedData.orderId)
      ),
      with: {
        order: {
          columns: {
            userId: true,
            status: true,
          },
        },
      },
    });

    if (!orderItem) {
      return { success: false, error: "Order item not found" };
    }

    if (orderItem.order.userId !== userId) {
      return { success: false, error: "Unauthorized" };
    }

    if (orderItem.order.status !== "delivered") {
      return {
        success: false,
        error: "You can only review items from delivered orders",
      };
    }

    // Check if review already exists for this order item
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.orderItemId, validatedData.orderItemId),
        eq(reviews.userId, userId)
      ),
    });

    if (existingReview) {
      return {
        success: false,
        error: "You have already reviewed this item",
      };
    }

    // Create the review
    const [newReview] = await db
      .insert(reviews)
      .values({
        userId,
        orderId: validatedData.orderId,
        orderItemId: validatedData.orderItemId,
        productId: validatedData.productId,
        sellerId: validatedData.sellerId,
        rating: validatedData.rating,
        title: validatedData.title || null,
        comment: validatedData.comment || null,
        images: validatedData.images || null,
        isAnonymous: validatedData.isAnonymous,
        isVerifiedPurchase: true,
        status: "pending", // Reviews need approval
        reviewType: "product",
      })
      .returning();

    // Revalidate product page
    revalidatePath(`/products/[slug]`, "page");

    return { success: true, data: newReview };
  } catch (error) {
    console.error("Error creating review:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to create review. Please try again.",
    };
  }
}

export async function createStoreReview(
  data: z.infer<typeof createStoreReviewSchema>
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createStoreReviewSchema.parse(data);

    const order = await db.query.orders.findFirst({
      where: and(
        eq(orders.id, validatedData.orderId),
        eq(orders.userId, userId)
      ),
      columns: { status: true },
    });

    if (!order) {
      return { success: false, error: "Order not found" };
    }

    if (order.status !== "delivered") {
      return {
        success: false,
        error: "You can only review stores from delivered orders",
      };
    }

    const hasSellerItem = await db.query.orderItems.findFirst({
      where: and(
        eq(orderItems.orderId, validatedData.orderId),
        eq(orderItems.sellerId, validatedData.sellerId)
      ),
      columns: { id: true },
    });

    if (!hasSellerItem) {
      return { success: false, error: "Seller not found in this order" };
    }

    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.orderId, validatedData.orderId),
        eq(reviews.sellerId, validatedData.sellerId),
        eq(reviews.userId, userId),
        eq(reviews.reviewType, "store")
      ),
    });

    if (existingReview) {
      return { success: false, error: "You have already reviewed this store" };
    }

    const [newReview] = await db
      .insert(reviews)
      .values({
        userId,
        orderId: validatedData.orderId,
        sellerId: validatedData.sellerId,
        productId: null,
        orderItemId: null,
        rating: validatedData.rating,
        title: validatedData.title || null,
        comment: validatedData.comment || null,
        isAnonymous: validatedData.isAnonymous,
        isVerifiedPurchase: true,
        status: "pending",
        reviewType: "store",
      })
      .returning();

    revalidatePath(`/orders/${validatedData.orderId}`);

    return { success: true, data: newReview };
  } catch (error) {
    console.error("Error creating store review:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to create store review. Please try again.",
    };
  }
}

export async function updateReview(data: z.infer<typeof updateReviewSchema>) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = updateReviewSchema.parse(data);

    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.id, validatedData.reviewId),
        eq(reviews.userId, userId)
      ),
    });

    if (!existingReview) {
      return { success: false, error: "Review not found" };
    }

    const [updatedReview] = await db
      .update(reviews)
      .set({
        rating: validatedData.rating,
        title: validatedData.title ?? existingReview.title,
        comment: validatedData.comment ?? existingReview.comment,
        images: validatedData.images ?? existingReview.images,
        isAnonymous:
          validatedData.isAnonymous ?? existingReview.isAnonymous ?? false,
        status: "pending",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(reviews.id, validatedData.reviewId))
      .returning();

    if (existingReview.orderId) {
      revalidatePath(`/orders/${existingReview.orderId}`);
    }
    if (existingReview.productId) {
      revalidatePath(`/products/[slug]`, "page");
    }

    return { success: true, data: updatedReview };
  } catch (error) {
    console.error("Error updating review:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to update review. Please try again.",
    };
  }
}

export async function getUserReviewForOrderItem(orderItemId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const review = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.orderItemId, orderItemId),
        eq(reviews.userId, userId),
        eq(reviews.reviewType, "product")
      ),
      columns: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        images: true,
        status: true,
        isAnonymous: true,
      },
    });

    return { success: true, data: review ?? null };
  } catch (error) {
    console.error("Error fetching user review:", error);
    return { success: false, error: "Failed to fetch review" };
  }
}

export async function getUserStoreReview(orderId: string, sellerId: string) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const review = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.orderId, orderId),
        eq(reviews.sellerId, sellerId),
        eq(reviews.userId, userId),
        eq(reviews.reviewType, "store")
      ),
      columns: {
        id: true,
        rating: true,
        title: true,
        comment: true,
        status: true,
        isAnonymous: true,
      },
    });

    return { success: true, data: review ?? null };
  } catch (error) {
    console.error("Error fetching store review:", error);
    return { success: false, error: "Failed to fetch store review" };
  }
}

export async function voteReview(data: z.infer<typeof voteReviewSchema>) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = voteReviewSchema.parse(data);

    // Check if user already voted
    const existingVote = await db.query.reviewVotes.findFirst({
      where: and(
        eq(reviewVotes.reviewId, validatedData.reviewId),
        eq(reviewVotes.userId, userId)
      ),
    });

    // Get the review to update counts
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, validatedData.reviewId),
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    if (existingVote) {
      // If user already voted with the same value, remove the vote
      if (existingVote.isHelpful === validatedData.isHelpful) {
        await db
          .delete(reviewVotes)
          .where(eq(reviewVotes.id, existingVote.id));

        // Update review counts
        await db
          .update(reviews)
          .set({
            helpfulCount: validatedData.isHelpful
              ? Math.max(0, (review.helpfulCount || 0) - 1)
              : review.helpfulCount || 0,
            unhelpfulCount: validatedData.isHelpful
              ? review.unhelpfulCount || 0
              : Math.max(0, (review.unhelpfulCount || 0) - 1),
          })
          .where(eq(reviews.id, validatedData.reviewId));
      } else {
        // Update the vote
        await db
          .update(reviewVotes)
          .set({ isHelpful: validatedData.isHelpful })
          .where(eq(reviewVotes.id, existingVote.id));

        // Update review counts
        await db
          .update(reviews)
          .set({
            helpfulCount: validatedData.isHelpful
              ? (review.helpfulCount || 0) + 1
              : Math.max(0, (review.helpfulCount || 0) - 1),
            unhelpfulCount: validatedData.isHelpful
              ? Math.max(0, (review.unhelpfulCount || 0) - 1)
              : (review.unhelpfulCount || 0) + 1,
          })
          .where(eq(reviews.id, validatedData.reviewId));
      }
    } else {
      // Create new vote
      await db.insert(reviewVotes).values({
        reviewId: validatedData.reviewId,
        userId,
        isHelpful: validatedData.isHelpful,
      });

      // Update review counts
      await db
        .update(reviews)
        .set({
          helpfulCount: validatedData.isHelpful
            ? (review.helpfulCount || 0) + 1
            : review.helpfulCount || 0,
          unhelpfulCount: validatedData.isHelpful
            ? review.unhelpfulCount || 0
            : (review.unhelpfulCount || 0) + 1,
        })
        .where(eq(reviews.id, validatedData.reviewId));
    }

    // Revalidate product page
    revalidatePath(`/products/[slug]`, "page");

    return { success: true };
  } catch (error) {
    console.error("Error voting on review:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to vote on review. Please try again.",
    };
  }
}

export async function createReviewComment(
  data: z.infer<typeof createReviewCommentSchema>
) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return { success: false, error: "Authentication required" };
    }

    const validatedData = createReviewCommentSchema.parse(data);

    // Verify review exists
    const review = await db.query.reviews.findFirst({
      where: eq(reviews.id, validatedData.reviewId),
      with: {
        product: {
          columns: {
            sellerId: true,
          },
        },
      },
    });

    if (!review) {
      return { success: false, error: "Review not found" };
    }

    // Create comment
    const [newComment] = await db
      .insert(reviewComments)
      .values({
        reviewId: validatedData.reviewId,
        userId,
        sellerId: review.product?.sellerId || null,
        comment: validatedData.comment,
        isAnonymous: validatedData.isAnonymous,
        status: "approved", // Comments can be auto-approved
      })
      .returning();

    // Revalidate product page
    revalidatePath(`/products/[slug]`, "page");

    return { success: true, data: newComment };
  } catch (error) {
    console.error("Error creating review comment:", error);
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0]?.message || "Validation error",
      };
    }
    return {
      success: false,
      error: "Failed to create comment. Please try again.",
    };
  }
}

export async function getProductReviews(productId: string) {
  try {
    const reviewsList = await db.query.reviews.findMany({
      where: and(
        eq(reviews.productId, productId),
        eq(reviews.status, "approved")
      ),
      orderBy: [desc(reviews.helpfulCount), desc(reviews.createdAt)],
      with: {
        user: {
          columns: {
            fullName: true,
            avatarUrl: true,
          },
        },
        reviewVotes: true,
        reviewComments: {
          orderBy: [desc(reviewComments.createdAt)],
          with: {
            user: {
              columns: {
                fullName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
    });

    return { success: true, data: reviewsList };
  } catch (error) {
    console.error("Error fetching product reviews:", error);
    return {
      success: false,
      error: "Failed to fetch reviews",
    };
  }
}
