import { OrderShippedEmail } from "../src/index.js";
import { address, customer, items } from "./_fixtures.js";

export default function CustomerOrderShipped() {
  return OrderShippedEmail({
    locale: "ar",
    customer,
    orderNumber: "ORDXT7NHSQ5",
    carrier: "Bosta",
    trackingNumber: "BST-7741902",
    estimatedDelivery: "17 أكتوبر 2026",
    items: items.slice(0, 1),
    shippingAddress: address,
    paymentMethod: "الدفع عند الاستلام",
    amountDue: "410 ج.م",
    links: { trackOrder: "https://tallaby.com/orders/1" },
  });
}
