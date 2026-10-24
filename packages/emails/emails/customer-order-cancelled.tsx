import { OrderCancelledEmail } from "../src/index.js";
import { customer, items } from "./_fixtures.js";

export default function CustomerOrderCancelled() {
  return OrderCancelledEmail({
    locale: "ar",
    customer,
    orderNumber: "ORDXT7NHSQ5",
    cancelledDate: "13 أكتوبر 2026",
    cancelledBy: "customer",
    payment: { kind: "cod" },
    items: items.slice(0, 1),
    links: { shop: "https://tallaby.com" },
  });
}
