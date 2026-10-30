"use server";

import {
  applyInvalidation,
  invalidateProduct,
  invalidateSellerProducts,
  mergeInvalidations,
  reviewTags,
  type CacheInvalidation,
  type ProductCacheSnapshot,
} from "@workspace/cache";
import { and, db, eq, inArray, notInArray, products, reviews } from "@workspace/db";
import { syncProductRating } from "@workspace/db/reviews";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { productSocialProofSchema, type SocialProofResult } from "./social-proof.dto";

/**
 * The product page caches (marketplace: by slug; store sites: by seller) and
 * the store review sections. Same before and after: nothing a listing sorts
 * or filters on changed, so only the product's own tags are purged.
 */
async function productPageInvalidation(productId: string, sellerId: string): Promise<CacheInvalidation> {
  const row = await db.query.products.findFirst({
    where: and(eq(products.id, productId), eq(products.sellerId, sellerId)),
    columns: { id: true, sellerId: true, categoryId: true, brandId: true, status: true },
    with: { productTranslations: { columns: { locale: true, slug: true } } },
  });
  const reviewsInvalidation = { tags: [reviewTags.seller(sellerId), reviewTags.product(productId)], paths: [] };
  if (!row) return mergeInvalidations(invalidateSellerProducts(sellerId), reviewsInvalidation);
  const snapshot: ProductCacheSnapshot = {
    id: row.id,
    sellerId: row.sellerId,
    categoryId: row.categoryId,
    brandId: row.brandId,
    slugs: row.productTranslations.map((t) => ({ locale: t.locale, slug: t.slug })),
    status: row.status,
    isFeatured: false,
    isTrending: false,
    isSeasonal: false,
    isMostSelling: false,
    isPlatformChoice: false,
    sponsored: false,
    priceKey: "",
  };
  return mergeInvalidations(invalidateProduct(snapshot, snapshot), invalidateSellerProducts(sellerId), reviewsInvalidation);
}

/**
 * Saves the product form's reviews, live views switch (0111) and low-stock
 * alert (0122). The product
 * must be the session seller's; only that product's seller-added reviews are
 * ever changed or removed (customer reviews are never touched). Review ids
 * from the client are matched together with the product and `source =
 * 'seller'`, so a foreign or customer review id simply matches nothing.
 */
export async function saveProductSocialProof(productId: string, input: unknown): Promise<SocialProofResult> {
  try {
    const seller = await requireSeller({ forWrite: true });
    const parsed = productSocialProofSchema.safeParse(input);
    if (!parsed.success || typeof productId !== "string") return { success: false, error: "invalidInput" };
    const { showLiveViews, showLowStockBadge, lowStockThreshold, reviews: list } = parsed.data;

    const owned = await db.transaction(async (tx) => {
      const updated = await tx
        .update(products)
        .set({ showLiveViews, showLowStockBadge, lowStockThreshold })
        .where(and(eq(products.id, productId), eq(products.sellerId, seller.sellerId)))
        .returning({ id: products.id });
      if (!updated.length) return false;

      const sellerRows = and(eq(reviews.productId, productId), eq(reviews.source, "seller"));
      const keptIds = list.flatMap((review) => (review.id ? [review.id] : []));
      await tx.delete(reviews).where(keptIds.length ? and(sellerRows, notInArray(reviews.id, keptIds)) : sellerRows);

      const existing = keptIds.length
        ? new Set((await tx.select({ id: reviews.id }).from(reviews).where(and(sellerRows, inArray(reviews.id, keptIds)))).map((row) => row.id))
        : new Set<string>();
      const now = new Date().toISOString();
      for (const review of list) {
        const fields = { reviewerName: review.reviewerName, rating: review.rating, comment: review.comment || null };
        if (review.id && existing.has(review.id)) {
          await tx.update(reviews).set({ ...fields, updatedAt: now }).where(and(sellerRows, eq(reviews.id, review.id)));
        } else {
          await tx.insert(reviews).values({
            ...fields,
            productId,
            sellerId: seller.sellerId,
            userId: null,
            source: "seller",
            status: "approved",
            reviewType: "product",
            isVerifiedPurchase: false,
          });
        }
      }
      return true;
    });
    if (!owned) return { success: false, error: "notFound" };

    await syncProductRating(productId);
    await applyInvalidation(await productPageInvalidation(productId, seller.sellerId), { from: "dashboard", mode: "action" });
    return { success: true };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: error.code === "seller_blocked" ? "readOnly" : "notFound" };
    console.error("[social-proof] save failed", error);
    return { success: false, error: "generic" };
  }
}
