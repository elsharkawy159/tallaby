"use server";

import { revalidatePath } from "next/cache";
import { applyInvalidation, invalidateProductQuantityOffers } from "@workspace/cache";
import { and, asc, db, eq, isNull, productQuantityOffers, products, productVariants } from "@workspace/db";
import { getPriceFinal } from "@workspace/lib";
import { parseQuantityTiers, type QuantityOfferType, type QuantityTiersError } from "@workspace/lib/orders/quantity-offers";
import { isAccessError, requireSeller } from "@/lib/auth/require-seller.server";
import { createRateLimiter } from "@/lib/rate-limit.lib";

/**
 * Quantity offers on the product form (ROADMAP.md F-07b). Tiers belong to the
 * seller's product and apply in every store that sells it. The product must be the
 * session seller's own; the id from the client only ever narrows that.
 */

const limiter = createRateLimiter({ limit: 60, windowMs: 10 * 60_000 });
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type QuantityOfferRow = {
  minQuantity: number;
  discountType: QuantityOfferType;
  discountValue: number;
  isActive: boolean;
};

export type SaveQuantityOffersResult =
  | { success: true; tiers: QuantityOfferRow[] }
  | { success: false; error: QuantityTiersError | "notFound" | "rateLimited" | "generic" };

export async function listQuantityOffers(productId: string): Promise<QuantityOfferRow[]> {
  const { sellerId } = await requireSeller();
  if (!UUID.test(String(productId))) return [];
  const rows = await db
    .select()
    .from(productQuantityOffers)
    .where(and(eq(productQuantityOffers.sellerId, sellerId), eq(productQuantityOffers.productId, productId)))
    .orderBy(asc(productQuantityOffers.minQuantity));
  return rows.map((row) => ({
    minQuantity: row.minQuantity,
    discountType: row.discountType === "fixed" ? "fixed" : "percent",
    discountValue: Number(row.discountValue),
    isActive: row.isActive,
  }));
}

/** Replaces the product's tiers. A fixed amount must stay below its lowest price. */
export async function saveQuantityOffers(input: { productId: string; tiers: unknown }): Promise<SaveQuantityOffersResult> {
  try {
    const { sellerId } = await requireSeller({ forWrite: true });
    if (!limiter.check(`quantity-offers:${sellerId}`)) return { success: false, error: "rateLimited" };
    const productId = String(input?.productId ?? "");
    if (!UUID.test(productId)) return { success: false, error: "notFound" };

    const [product] = await db
      .select({ price: products.price })
      .from(products)
      .where(and(eq(products.id, productId), eq(products.sellerId, sellerId), isNull(products.deletedAt)))
      .limit(1);
    if (!product) return { success: false, error: "notFound" };

    const variants = await db.select({ price: productVariants.price }).from(productVariants).where(eq(productVariants.productId, productId));
    const prices = (variants.length > 0 ? variants.map((variant) => variant.price) : [product.price]).map((price) => Math.round(getPriceFinal(price) * 100));
    const parsed = parseQuantityTiers(input?.tiers, Math.min(...prices));
    if (!parsed.ok) return { success: false, error: parsed.error };

    await db.transaction(async (tx) => {
      await tx.delete(productQuantityOffers).where(and(eq(productQuantityOffers.sellerId, sellerId), eq(productQuantityOffers.productId, productId)));
      if (parsed.tiers.length > 0) {
        await tx.insert(productQuantityOffers).values(
          parsed.tiers.map((tier, index) => ({
            sellerId,
            productId,
            minQuantity: tier.minQuantity,
            discountType: tier.discountType,
            discountValue: tier.discountValue.toFixed(2),
            isActive: tier.isActive,
            sortOrder: index,
          })),
        );
      }
    });

    await applyInvalidation(invalidateProductQuantityOffers(sellerId, productId), { from: "dashboard", mode: "action" });
    revalidatePath(`/products/${productId}/edit`);
    return { success: true, tiers: await listQuantityOffers(productId) };
  } catch (error) {
    if (isAccessError(error)) return { success: false, error: "notFound" };
    console.error("[quantity-offers] save failed", (error as Error)?.name);
    return { success: false, error: "generic" };
  }
}
