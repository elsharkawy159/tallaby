/**
 * Digital products at checkout (ROADMAP.md F-108b, owner default): a cart with
 * ANY digital product takes no cash on delivery, since nothing is delivered to
 * pay for, and so no COD deposit (F-21) either. Every other method (the store's
 * card gateway or Tallaby Pay, InstaPay and the mobile wallets the seller
 * confirms) stays as it is. Physical-only carts are untouched. Pure; no DB.
 */
import type { StorefrontCheckoutPayments } from "./store-methods";

/** placeOrderFromCart's refusal of a COD order for a cart with a digital product. */
export const DIGITAL_NO_COD_ERROR = "digitalNoCashOnDelivery";

const COD_METHODS: readonly string[] = ["cash_on_delivery", "wallet_cash_on_delivery"];

/** True when any line is a digital product (`products.product_type`). */
export function cartHasDigitalProduct(lines: readonly { product?: { productType?: string | null } | null }[]): boolean {
  return lines.some((line) => line.product?.productType === "digital");
}

/** Cash paid to the deliverer, alone or as a customer-wallet remainder. */
export function isCashOnDeliveryMethod(method: string): boolean {
  return COD_METHODS.includes(method);
}

/** Whether a checkout value may pay a cart (server check; the UI hides what this refuses). */
export function isPaymentMethodAllowedForCart(method: string, cart: { hasDigital: boolean }): boolean {
  return !(cart.hasDigital && isCashOnDeliveryMethod(method));
}

/**
 * A storefront's checkout methods for one cart: unchanged for a physical-only
 * cart (the same object); with a digital product, cash on delivery, its
 * deposit, note and maximum are removed, and the seller's default falls back
 * when it was COD. `methods` can end up empty: the checkout then says the store
 * can't take payment for digital products yet.
 */
export function allowedPaymentMethodsForCart(
  checkout: StorefrontCheckoutPayments,
  cart: { hasDigital: boolean },
): StorefrontCheckoutPayments {
  if (!cart.hasDigital) return checkout;
  const methods = checkout.methods.filter((method) => !isCashOnDeliveryMethod(method));
  return {
    ...checkout,
    methods,
    defaultMethod: checkout.defaultMethod && methods.includes(checkout.defaultMethod) ? checkout.defaultMethod : null,
    codMaxOrder: null,
    codNote: null,
    deposit: null,
  };
}
