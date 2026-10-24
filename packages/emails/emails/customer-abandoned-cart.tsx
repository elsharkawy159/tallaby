import { AbandonedCartEmail } from "../src/index.js";
import { items } from "./_fixtures.js";

export default function CustomerAbandonedCart() {
  return AbandonedCartEmail({
    locale: "ar",
    items,
    subtotal: "530 ج.م",
    coupon: { code: "BACK10", discountLabel: "10%", discountAmount: "53 ج.م", totalAfter: "477 ج.م", expiresOn: "25 أكتوبر" },
    links: { cart: "https://tallaby.com/cart" },
  });
}
