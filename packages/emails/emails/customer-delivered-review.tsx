import { OrderDeliveredEmail } from "../src/index.js";
import { customer, items } from "./_fixtures.js";

export default function CustomerDeliveredReview() {
  return OrderDeliveredEmail({
    locale: "ar",
    customer,
    orderNumber: "ORDXT7NHSQ5",
    deliveredDate: "16 أكتوبر 2026",
    items: items.slice(0, 1).map((item) => ({ ...item, reviewUrl: "https://tallaby.com/products/mug#reviews" })),
    returnWindowDays: 14,
    links: { order: "https://tallaby.com/orders/1", returns: "https://tallaby.com/returns" },
  });
}
