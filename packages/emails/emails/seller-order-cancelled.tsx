import { SellerOrderCancelledEmail } from "../src/index.js";
import { items, settingsUrl } from "./_fixtures.js";

export default function SellerOrderCancelled() {
  return SellerOrderCancelledEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    orderNumber: "ORDXT7NHSQ5",
    cancelledAt: "13 أكتوبر 2026، 9:15 ص",
    byCustomer: true,
    reason: "غيّر رأيه",
    value: "410 ج.م",
    stockRestored: true,
    items: items.slice(0, 1),
    links: { order: "https://dashboard.tallaby.com/orders/1" },
  });
}
