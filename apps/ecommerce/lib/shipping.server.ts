/**
 * Checkout shipping for display (summary, coupons). Server-only: it reads the
 * store's zones. `placeOrderFromCart` runs the same quote when the order is
 * placed, so what the summary shows is what the order charges (store shipping
 * spec §6.5). Never cached (rule 8).
 */
import {
  resolveStorefrontShipping,
  zoneSellerFreeDeliveryDiscount,
  type ShippingAddress,
  type StorefrontShipping,
} from "@workspace/lib/shipping/store-quote";
import { cartHasPhysicalItems, resolveCartSubtotal } from "@workspace/lib/shipping";
import { getStorefrontShippingContext } from "@workspace/lib/stores/server";
import type { CheckoutSummary } from "@/lib/coupon-utils";
import type { CartScope } from "@/lib/storefront.server";
import {
  calculateOrderSellerFreeDeliveryDiscount,
  calculateOrderShippingCost,
  type OrderShippingCartItem,
} from "@/lib/shipping";

/**
 * The store-website shipping quote for an address, or null when there is no
 * address yet, the cart has nothing to ship, or the store does not deliver
 * itself (Tallaby rates then apply).
 * `storeId` must be server-trusted (the cart scope from the request host).
 */
export async function getStorefrontShippingQuote(
  storeId: string,
  address: ShippingAddress | null,
  items: OrderShippingCartItem[],
): Promise<StorefrontShipping | null> {
  // A digital-only cart ships nothing: placeOrderFromCart skips the quote too.
  if (!address || !cartHasPhysicalItems(items)) return null;
  const context = await getStorefrontShippingContext(storeId);
  if (!context || context.settings.method !== "own") return null;
  const subtotal = resolveCartSubtotal(items);
  return resolveStorefrontShipping({
    settings: context.settings,
    zones: context.zones,
    address,
    items,
    subtotal,
    tallabyRate: (state) => calculateOrderShippingCost(items, { destinationState: state, cartSubtotal: subtotal }) ?? 0,
  });
}

export type CheckoutShipping = {
  shippingCost: number | null;
  sellerFreeDeliveryDiscount: number;
  storeShipping: CheckoutSummary["storeShipping"];
};

/**
 * Shipping for a checkout summary. The marketplace (`scope` null) and the
 * Tallaby-rates fallback keep today's rate-table numbers; a zone gives its
 * price; a refused address gives no price and the reason.
 */
export async function getCheckoutShipping(
  items: OrderShippingCartItem[],
  address: ShippingAddress | null,
  scope: CartScope | null,
): Promise<CheckoutShipping> {
  const rateTable = (): Omit<CheckoutShipping, "storeShipping"> => {
    const destinationState = address?.state ?? null;
    return {
      shippingCost: calculateOrderShippingCost(items, { destinationState }),
      sellerFreeDeliveryDiscount: calculateOrderSellerFreeDeliveryDiscount(items, { destinationState }),
    };
  };

  const quote = scope ? await getStorefrontShippingQuote(scope.storeId, address, items) : null;
  if (!quote) return { ...rateTable(), storeShipping: null };

  switch (quote.kind) {
    case "zone":
      return {
        shippingCost: quote.shippingCost,
        sellerFreeDeliveryDiscount: zoneSellerFreeDeliveryDiscount(quote, items),
        storeShipping: {
          kind: "zone",
          daysMin: quote.daysMin,
          daysMax: quote.daysMax,
          codEnabled: quote.codEnabled,
        },
      };
    case "tallaby_rates":
      return { ...rateTable(), storeShipping: { kind: "tallaby_rates" } };
    case "not_covered":
    case "outside_egypt":
      return { shippingCost: null, sellerFreeDeliveryDiscount: 0, storeShipping: { kind: quote.kind } };
  }
}
