"use server";

import { cacheProfiles, createCachedQuery, productTags } from "@workspace/cache";
import { and, asc, cartItems, db, eq, productQuantityOffers } from "@workspace/db";
import { storeCartDiscounts } from "@workspace/lib/orders/line-discounts/server";
import type { LineOfferKind } from "@workspace/lib/orders/line-discounts";
import type { QuantityOfferType } from "@workspace/lib/orders/quantity-offers";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { activeCartWhere, getCartScope } from "@/lib/storefront.server";

export type QuantityTierCard = {
  minQuantity: number;
  discountType: QuantityOfferType;
  discountValue: number;
};

/** The active tiers a product page shows. A preview: the checkout reads them fresh. */
const loadTiers = createCachedQuery({
  name: "storefront:quantity-offers:v1",
  ttl: cacheProfiles.listing,
  tags: (sellerId: string, productId: string) => [productTags.quantityOffers(sellerId, productId)],
  query: async (sellerId: string, productId: string): Promise<QuantityTierCard[]> => {
    const rows = await db
      .select()
      .from(productQuantityOffers)
      .where(and(eq(productQuantityOffers.sellerId, sellerId), eq(productQuantityOffers.productId, productId), eq(productQuantityOffers.isActive, true)))
      .orderBy(asc(productQuantityOffers.minQuantity));
    return rows.map((row) => ({
      minQuantity: row.minQuantity,
      discountType: row.discountType === "fixed" ? "fixed" : "percent",
      discountValue: Number(row.discountValue),
    }));
  },
});

/** The tiers of a product, for this request's own store. The seller comes from the host. */
export async function getQuantityTiers(productId: string): Promise<QuantityTierCard[]> {
  try {
    const scope = await getCartScope();
    if (!scope?.sellerId || typeof productId !== "string") return [];
    return await loadTiers(scope.sellerId, productId);
  } catch (error) {
    console.error("[quantity-offers] tiers failed", (error as Error)?.name);
    return [];
  }
}

export type CartOffersView = {
  /** Per cart item id: what its offer takes off, in piastres. */
  lines: Record<string, { kind: LineOfferKind; discountPiastres: number }>;
  totalPiastres: number;
};

/**
 * What the offers take off this customer's cart, priced by the same function as
 * the order. Never cached. Marketplace carts have none.
 */
export async function getCartOffers(): Promise<CartOffersView> {
  const empty: CartOffersView = { lines: {}, totalPiastres: 0 };
  try {
    const userId = await getCurrentUserId();
    const scope = await getCartScope();
    if (!userId || !scope) return empty;
    const cart = await db.query.carts.findFirst({
      where: activeCartWhere(userId, scope),
      with: { cartItems: { where: eq(cartItems.savedForLater, false) } },
    });
    if (!cart) return empty;
    const offers = await storeCartDiscounts(cart.storeId, cart.cartItems);
    const lines: CartOffersView["lines"] = {};
    cart.cartItems.forEach((item, index) => {
      const offer = offers.lines[index];
      if (offer) lines[item.id] = { kind: offer.kind, discountPiastres: offer.discountPiastres };
    });
    return { lines, totalPiastres: offers.totalPiastres };
  } catch (error) {
    console.error("[cart-offers] failed", (error as Error)?.name);
    return empty;
  }
}
