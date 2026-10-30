import { z } from "zod";
import { LOW_STOCK_THRESHOLD_MAX, LOW_STOCK_THRESHOLD_MIN } from "@workspace/store-sections/low-stock";

/**
 * The product form's "Reviews and live views" part (0111): reviews the seller
 * really received elsewhere and types in, the live views counter switch, and
 * the low-stock alert (0122, ROADMAP.md F-34).
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

/** The low-stock threshold; empty (null) means the default, 5. */
export const lowStockThresholdSchema = z.number().int().min(LOW_STOCK_THRESHOLD_MIN).max(LOW_STOCK_THRESHOLD_MAX).nullable();

export const productSocialProofSchema = z.object({
  showLiveViews: z.boolean(),
  showLowStockBadge: z.boolean().default(false),
  lowStockThreshold: lowStockThresholdSchema.default(null),
  reviews: z.array(sellerReviewSchema).max(SELLER_REVIEWS_MAX),
});

export type ProductSocialProofInput = z.infer<typeof productSocialProofSchema>;

export type SocialProofResult = { success: true } | { success: false; error: "invalidInput" | "notFound" | "readOnly" | "generic" };
