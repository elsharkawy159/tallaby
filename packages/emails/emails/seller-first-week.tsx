import { SellerFirstWeekEmail } from "../src/index.js";

export default function SellerFirstWeek() {
  return SellerFirstWeekEmail({
    storeName: "متجر النور",
    analyticsUrl: "https://dashboard.tallaby.com/stores/33333333-3333-4333-8333-333333333333/analytics",
    visits: 124,
    orders: 6,
  });
}
