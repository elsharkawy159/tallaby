import { SellerSetupReminderEmail } from "../src/index.js";

const STORE = "33333333-3333-4333-8333-333333333333";
const dash = "https://dashboard.tallaby.com";

export default function SellerSetupReminder() {
  return SellerSetupReminderEmail({
    kind: "day1",
    locale: "ar",
    sellerName: "أحمد",
    storeName: "متجر النور",
    setupUrl: `${dash}/`,
    optOutUrl: `${dash}/api/email/setup-reminders/unsubscribe?token=preview`,
    steps: [
      { key: "product", href: `${dash}/stores/${STORE}/products/add`, done: true },
      { key: "design", href: `${dash}/stores/${STORE}/website/templates`, done: false },
      { key: "payments", href: `${dash}/stores/${STORE}/settings/payments`, done: false },
      { key: "shipping", href: `${dash}/stores/${STORE}/shipping`, done: false },
    ],
  });
}
