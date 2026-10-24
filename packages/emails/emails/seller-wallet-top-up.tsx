import { SellerWalletTopUpEmail } from "../src/index.js";
import { settingsUrl } from "./_fixtures.js";

export default function SellerWalletTopUp() {
  return SellerWalletTopUpEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    amount: "500 ج.م",
    balance: "1,250 ج.م",
    previousBalance: "750 ج.م",
    reference: "TU-20261023-417",
    method: "card",
    date: "23 أكتوبر 2026",
    links: { wallet: "https://dashboard.tallaby.com/wallet", topUp: "https://dashboard.tallaby.com/wallet" },
  });
}
