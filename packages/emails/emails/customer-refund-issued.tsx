import { RefundIssuedEmail } from "../src/index.js";
import { customer } from "./_fixtures.js";

export default function CustomerRefundIssued() {
  return RefundIssuedEmail({
    locale: "ar",
    customer,
    orderNumber: "ORDXT7NHSQ5",
    amount: "350 ج.م",
    method: "wallet",
    date: "20 أكتوبر 2026",
    items: [
      {
        name: "مج حراري استانلس ستيل - 800 مل",
        reason: "لا يطابق الوصف",
        amount: "350 ج.م",
        imageUrl: "https://placehold.co/136x136/f7f7f7/145163.png?text=Mug",
      },
    ],
    itemsValue: "350 ج.م",
    links: { wallet: "https://tallaby.com/profile/wallet", order: "https://tallaby.com/orders/1" },
  });
}
