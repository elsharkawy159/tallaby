import { SellerPayoutEmail } from "../src/index.js";
import { settingsUrl } from "./_fixtures.js";

/** Template only: seller payouts are not built yet, so nothing sends this. */
export default function SellerPayoutSent() {
  return SellerPayoutEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    amount: "3,240 ج.م",
    reference: "PO-20261013-88",
    account: "CIB •••• 4021",
    date: "13 أكتوبر 2026",
    period: "6 – 12 أكتوبر 2026",
    rows: [
      { label: "إجمالي المبيعات (12 طلبًا)", value: "3,600 ج.م" },
      { label: "رسوم المنصة", value: "−60 ج.م" },
      { label: "مرتجعات", value: "−300 ج.م" },
    ],
    links: { statement: "https://dashboard.tallaby.com/wallet", bankSettings: "https://dashboard.tallaby.com/settings" },
  });
}
