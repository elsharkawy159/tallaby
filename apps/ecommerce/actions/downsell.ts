"use server";

import { and, cartItems, db, eq, isNull } from "@workspace/db";
import { findCheckoutDownsell, findProductDownsell, findUsableStoreCoupon, type CheckoutDownsell } from "@workspace/lib/downsell/server";
import { getLocale } from "next-intl/server";
import { addToCart, removeFromCart } from "@/actions/cart";
import { applyCouponToCart } from "@/actions/coupons";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { activeCartWhere, getCartScope } from "@/lib/storefront.server";
import { isSwitchOn } from "@/lib/platform-switches.server";

/**
 * Downsell on the store website's checkout (ROADMAP.md F-116). The store comes
 * from the request host and the cart from the session, never from the client;
 * a marketplace checkout (no store host) gets nothing. Taking the offer goes
 * through the existing cart and coupon actions, so prices, stock and discounts
 * are checked there and again when the order is placed (`placeOrderFromCart`
 * is unchanged).
 */

/** The customer's own lines in this store's active cart (not saved for later, not gifts). */
async function ownCart() {
  const scope = await getCartScope();
  const userId = await getCurrentUserId();
  if (!scope?.storeId || !scope.sellerId || !userId) return null;
  const cart = await db.query.carts.findFirst({
    where: activeCartWhere(userId, scope),
    columns: { id: true },
    with: {
      cartItems: {
        where: and(eq(cartItems.savedForLater, false), isNull(cartItems.giftRuleId), isNull(cartItems.crossSellId)),
        columns: { id: true, productId: true, price: true, quantity: true, variant: true },
      },
    },
  });
  if (!cart) return null;
  return { scope: { storeId: scope.storeId, sellerId: scope.sellerId }, lines: cart.cartItems };
}

/** The one offer to show for this checkout, or null. */
export async function getCheckoutDownsell(): Promise<CheckoutDownsell | null> {
  try {
    const cart = await ownCart();
    if (!cart || cart.lines.length === 0) return null;
    return await findCheckoutDownsell({
      sellerId: cart.scope.sellerId,
      storeId: cart.scope.storeId,
      catalogSplit: await isSwitchOn("stores_catalog_split"),
      lines: cart.lines.map((line) => ({ lineId: line.id, productId: line.productId, unitMinor: Math.round(Number(line.price) * 100) })),
      locale: await getLocale(),
    });
  } catch (error) {
    console.error("[downsell] offer failed", (error as Error)?.name);
    return null;
  }
}

type LineOffer = NonNullable<Awaited<ReturnType<typeof lineOffer>>>;

/** The cart line (the customer's, in this store) and the offer row on its product. */
async function lineOffer(lineId: unknown) {
  if (typeof lineId !== "string") return null;
  const cart = await ownCart();
  const line = cart?.lines.find((item) => item.id === lineId);
  if (!cart || !line) return null;
  const offer = await findProductDownsell(cart.scope.sellerId, cart.scope.storeId, line.productId);
  return offer ? { cart, line, offer } : null;
}

/**
 * Swaps the line for the cheaper product (same quantity), through `addToCart`
 * (stock, store and minimum checks) and then `removeFromCart`. The live offer
 * is looked up again first, so a stale modal can't swap to anything else.
 */
export async function swapToDownsellProduct(lineId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const found: LineOffer | null = await lineOffer(lineId);
    if (!found?.offer.offerProductId) return { success: false };
    const current = await getCheckoutDownsell();
    if (current?.lineId !== found.line.id || current.offer.kind !== "product" || current.offer.hasVariants) return { success: false };

    const added = await addToCart({ productId: found.offer.offerProductId, quantity: found.line.quantity });
    if (!added.success) return { success: false, error: "error" in added ? (added.error as string) : undefined };
    await removeFromCart(found.line.id);
    return { success: true };
  } catch (error) {
    console.error("[downsell] swap failed", (error as Error)?.name);
    return { success: false };
  }
}

/** Applies the offer's coupon through the normal coupon flow (`applyCouponToCart`), which checks it with the cart. */
export async function applyDownsellCoupon(input: { lineId: string; shippingAddressId?: string }) {
  try {
    const found = await lineOffer(input?.lineId);
    if (!found?.offer.couponId) return { success: false as const, error: "invalidCoupon" };
    // Only the offer the checkout shows right now (app installed, this line, a coupon offer).
    const current = await getCheckoutDownsell();
    if (current?.lineId !== found.line.id || current.offer.kind !== "coupon") return { success: false as const, error: "invalidCoupon" };
    const coupon = await findUsableStoreCoupon(found.cart.scope.sellerId, found.cart.scope.storeId, found.offer.couponId);
    if (!coupon) return { success: false as const, error: "invalidCoupon" };
    const shippingAddressId = typeof input?.shippingAddressId === "string" && input.shippingAddressId ? input.shippingAddressId : undefined;
    return await applyCouponToCart({ code: coupon.code, shippingAddressId });
  } catch (error) {
    console.error("[downsell] coupon failed", (error as Error)?.name);
    return { success: false as const, error: "failedToApplyCoupon" };
  }
}
