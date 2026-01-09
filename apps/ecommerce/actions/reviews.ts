"use server";

import { db, eq, and, desc } from "@workspace/db";
import { reviews, reviewVotes, reviewComments, orderItems } from "@workspace/db";
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
