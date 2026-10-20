import type { Design } from "../builder";
import { cartCoupon } from "./cart-coupon";
import { cartEmpty } from "./cart-empty";
import { cartExtras } from "./cart-extras";
import { cartFreeDelivery } from "./cart-free-delivery";

/**
 * Cart & checkout (Claude Design library J). Trees have no cart data and the
 * storefront cart and checkout pages are not builder pages, so only the
 * sections that work from store products, categories or typed text are here:
 * order extras (J-c), the empty-cart landing (J-b), the free-delivery goal
 * (J-e) and an unlocked coupon (J-j). The first is the default.
 */
export const CART_DESIGNS: readonly Design[] = [cartExtras, cartEmpty, cartFreeDelivery, cartCoupon];
