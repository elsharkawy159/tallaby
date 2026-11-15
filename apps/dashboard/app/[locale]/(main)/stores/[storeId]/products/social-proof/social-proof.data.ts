import type { SQL } from "drizzle-orm";
import { and, asc, db, eq, products, reviews } from "@workspace/db";
import type { ProductSocialProofInput } from "./social-proof.dto";

/**
 * The edit form's reviews and live views switch. Callers pass the session
 * seller's id and the checked page store's `inStore` condition
 * (`requireProductStore`/`loadProductStorePage`, F-87c): a product outside the
 * store reads as the empty defaults.
 */
export async function loadProductSocialProof(sellerId: string, productId: string, inStore: SQL): Promise<ProductSocialProofInput> {
  const [product] = await db
    .select({
      showLiveViews: products.showLiveViews,
      trackStock: products.trackStock,
      showLowStockBadge: products.showLowStockBadge,
      lowStockThreshold: products.lowStockThreshold,
      minOrderQuantity: products.minOrderQuantity,
    })
    .from(products)
    .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), inStore))
    .limit(1);
  if (!product) return { showLiveViews: false, trackStock: true, showLowStockBadge: false, lowStockThreshold: null, minOrderQuantity: 1, reviews: [] };

  const rows = await db
    .select({ id: reviews.id, reviewerName: reviews.reviewerName, rating: reviews.rating, comment: reviews.comment })
    .from(reviews)
    .where(and(eq(reviews.productId, productId), eq(reviews.sellerId, sellerId), eq(reviews.source, "seller")))
    .orderBy(asc(reviews.createdAt));

  return {
    showLiveViews: product.showLiveViews,
    trackStock: product.trackStock,
    showLowStockBadge: product.showLowStockBadge,
    lowStockThreshold: product.lowStockThreshold,
    minOrderQuantity: product.minOrderQuantity,
    reviews: rows.map((row) => ({ id: row.id, reviewerName: row.reviewerName ?? "", rating: row.rating, comment: row.comment ?? "" })),
  };
}
