import { OrderConfirmationEmail } from "../src/index.js";
import { customer, sampleStore } from "./_fixtures.js";

/** Store-branded variant: a storefront order uses the store's colours. */
export default function CustomerOrderConfirmation() {
  return OrderConfirmationEmail({
    locale: "ar",
    brand: sampleStore,
    customer,
    order: { orderNumber: "ORDXT7NHSQ5", orderDate: "12 أكتوبر 2026", estimatedDelivery: "17 أكتوبر 2026" },
    items: [
      {
        productName: "مج حراري استانلس ستيل مع شاليموه - 800 مل",
        variantName: "وردي",
        quantity: 1,
        unitPrice: "350 ج.م",
        lineTotal: "350 ج.م",
        imageUrl: "https://placehold.co/136x136/f7f7f7/145163.png?text=Mug",
      },
    ],
    pricing: { subtotal: "350 ج.م", shipping: "60 ج.م", total: "410 ج.م" },
    paymentMethod: "الدفع عند الاستلام",
    isCashOnDelivery: true,
    shippingAddress: {
      fullName: "عمر محمد",
      addressLine1: "شارع إحسان عبد القدوس، مصر الجديدة",
      city: "القاهرة",
      state: "القاهرة",
      postalCode: "11774",
      country: "مصر",
      phone: "01152372358",
    },
    links: { viewOrder: "https://sara.tallaby.com/orders/1" },
  });
}
