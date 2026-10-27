import { z } from "zod";

/**
 * The product form's "Reviews and live views" part (0111): reviews the seller
 * really received elsewhere and types in, and the live views counter switch.
 * Saved by saveProductSocialProof after createProduct / updateProduct, so
 * actions/products.ts stays untouched.
 */

export const SELLER_REVIEWS_MAX = 50;
export const REVIEWER_NAME_MAX = 80;
export const REVIEW_COMMENT_MAX = 1000;

export const sellerReviewSchema = z.object({
  /** The saved review's id (edit); missing on a review added in this session. */
  id: z.string().uuid().optional(),
  reviewerName: z.string().trim().min(1, "product.reviewerNameRequired").max(REVIEWER_NAME_MAX),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(REVIEW_COMMENT_MAX).optional().default(""),
});

export type SellerReviewInput = z.infer<typeof sellerReviewSchema>;

export const productSocialProofSchema = z.object({
  showLiveViews: z.boolean(),
  reviews: z.array(sellerReviewSchema).max(SELLER_REVIEWS_MAX),
});

export type ProductSocialProofInput = z.infer<typeof productSocialProofSchema>;

export type SocialProofResult = { success: true } | { success: false; error: "invalidInput" | "notFound" | "readOnly" | "generic" };
