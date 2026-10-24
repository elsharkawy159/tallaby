import { SellerNewOrderEmail } from "../src/index.js";
import { address, items, settingsUrl } from "./_fixtures.js";

export default function SellerNewOrder() {
  return SellerNewOrderEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    customerName: "عمر",
    orderNumber: "ORDXT7NHSQ5",
    placedAt: "12 أكتوبر 2026، 12:30 ص",
    total: "410 ج.م",
    subtotal: "350 ج.م",
    shipping: "60 ج.م",
    paymentMethod: "الدفع عند الاستلام",
    isCashOnDelivery: true,
    shipBy: "14 أكتوبر 2026",
    promisedBy: "17 أكتوبر",
    items: items.slice(0, 1),
    shippingAddress: address,
    links: { order: "https://dashboard.tallaby.com/orders/1" },
  });
}
