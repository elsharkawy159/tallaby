import { SellerTallabyPayEmail } from "../src/index.js";
import { settingsUrl } from "./_fixtures.js";

export default function SellerTallabyPay() {
  return SellerTallabyPayEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    kind: "payoutPaid",
    amount: "1,250.00 جنيه",
    reference: "IP-88213",
    date: "18 نوفمبر 2026",
    links: { earnings: "https://dashboard.tallaby.com/stores/1/earnings" },
  });
}
