"use server";

import { and, cartItems, db, eq, userAddresses, users } from "@workspace/db";
import { saveStoreCheckoutLead } from "@workspace/lib/checkout-leads/server";
import type { CheckoutLeadItem } from "@workspace/lib/checkout-leads";
import { getLocale } from "next-intl/server";
import { getCurrentUserId } from "@/lib/get-current-user-id";
import { createRateLimiter } from "@/lib/rate-limit.lib";
import { getCheckoutShipping } from "@/lib/shipping.server";
import { activeCartWhere, getCartScope, isRequestStoreOffline } from "@/lib/storefront.server";
import { mergeProductWithTranslation, pickTranslationFromArray, type ProductLocale } from "@/lib/product-translations";

/**
 * Missed orders (0120, ROADMAP.md F-03): store-website checkout saves a lead
 * once the customer has a shipping address. Everything comes from the request
 * host and the session: the store from the host, the user and cart from the
 * session, the address only if it is that user's. The client sends only which
 * of its own addresses is selected. Never blocks or slows the checkout: every
 * failure is swallowed.
 */

/** At most 5 saves per user a minute (the client also waits a second after each change). */
const leadLimiter = createRateLimiter({ limit: 5, windowMs: 60_000 });
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** The first product image as a public URL (absolute URLs as they are). */
const firstImage = (images: unknown): string | null => {
  const list = Array.isArray(images) ? images : [];
  const first = list.find((v) => typeof v === "string" && v.trim()) as string | undefined;
  if (!first) return null;
  if (/^https?:\/\//.test(first)) return first;
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return base ? `${base}/storage/v1/object/public/products/${first}` : null;
};

/**
 * Returns what the browser needs for the store Pixel's Lead event (F-30b:
 * sent only when the seller switched Lead on; `event_id` is per cart), or
 * null when no lead was saved.
 */
export async function saveCheckoutLead(input: { addressId: string }): Promise<{ eventId: string; value: number } | null> {
  try {
    const addressId = String(input?.addressId ?? "");
    if (!UUID_RE.test(addressId)) return null;

    const scope = await getCartScope();
    if (!scope || (await isRequestStoreOffline())) return null;
    const userId = await getCurrentUserId();
    if (!userId || !leadLimiter.check(`lead:${userId}`)) return null;

    const [address, user, cart] = await Promise.all([
      db.query.userAddresses.findFirst({
        where: and(eq(userAddresses.id, addressId), eq(userAddresses.userId, userId)),
        columns: { fullName: true, phone: true, state: true, city: true, country: true, addressLine1: true },
      }),
      db.query.users.findFirst({ where: eq(users.id, userId), columns: { email: true, isGuest: true } }),
      db.query.carts.findFirst({
        where: activeCartWhere(userId, scope),
        columns: { id: true },
        with: {
          cartItems: {
            where: eq(cartItems.savedForLater, false),
            columns: { quantity: true, price: true, productId: true },
            with: {
              product: {
                columns: { id: true, sellerId: true, productType: true, freeDelivery: true, dimensions: true, images: true },
                with: {
                  productTranslations: { columns: { locale: true, title: true } },
                  seller: { columns: { freeDelivery: true } },
                },
              },
            },
          },
        },
      }),
    ]);
    if (!address || !cart || cart.cartItems.length === 0) return null;

    const locale = (await getLocale()) as ProductLocale;
    const items: CheckoutLeadItem[] = cart.cartItems.map((item) => {
      const translation = pickTranslationFromArray(item.product?.productTranslations ?? [], locale);
      const title = String(mergeProductWithTranslation(item.product ?? {}, translation)?.title ?? "");
      return {
        productId: item.productId,
        title,
        quantity: item.quantity,
        price: Number(item.price ?? 0).toFixed(2),
        image: firstImage(item.product?.images),
      };
    });
    const subtotal = cart.cartItems.reduce((sum, item) => sum + Number(item.price ?? 0) * item.quantity, 0);

    // The same quote the checkout shows for this address (store zones or Tallaby rates).
    const { shippingCost } = await getCheckoutShipping(cart.cartItems, address, scope);

    const saved = await saveStoreCheckoutLead({
      storeId: scope.storeId,
      sellerId: scope.sellerId,
      userId,
      cartId: cart.id,
      fullName: address.fullName ?? "",
      phone: address.phone ?? "",
      // Guests carry a placeholder email; only a signed-in customer's is real.
      email: user && !user.isGuest ? (user.email ?? null) : null,
      governorate: address.state ?? null,
      city: address.city ?? null,
      items,
      subtotal,
      shipping: shippingCost,
      total: shippingCost == null ? null : subtotal + shippingCost,
    });
    return saved ? { eventId: `lead-${cart.id}`, value: subtotal } : null;
  } catch {
    // Never log the phone; never let a lead break the checkout.
    console.error("[checkout-lead] save failed");
    return null;
  }
}
