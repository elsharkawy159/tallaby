import { and, asc, db, eq, products, reviews } from "@workspace/db";
import type { ProductSocialProofInput } from "./social-proof.dto";

/** The edit form's reviews and live views switch; callers pass the session seller's id. */
export async function loadProductSocialProof(sellerId: string, productId: string): Promise<ProductSocialProofInput> {
  const [product] = await db
    .select({ showLiveViews: products.showLiveViews })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerId)))
    .limit(1);
  if (!product) return { showLiveViews: false, reviews: [] };

  const rows = await db
    .select({ id: reviews.id, reviewerName: reviews.reviewerName, rating: reviews.rating, comment: reviews.comment })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.sellerId, sellerId), eq(reviews.source, "seller")))
    .orderBy(asc(reviews.createdAt));

  return {
    showLiveViews: product.showLiveViews,
    reviews: rows.map((row) => ({ id: row.id, reviewerName: row.reviewerName ?? "", rating: row.rating, comment: row.comment ?? "" })),
  };
}
