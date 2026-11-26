import { SellerWeeklyInsightsEmail } from "../src/index.js";

const dash = "https://dashboard.tallaby.com";

export default function SellerWeeklyInsights() {
  return SellerWeeklyInsightsEmail({
    locale: "ar",
    weekStart: "2026-11-15",
    weekLastDay: "2026-11-21",
    firstWeek: false,
    optOutUrl: `${dash}/api/email/weekly-insights/unsubscribe?token=preview`,
    stores: [
      {
        name: "متجر النور",
        analyticsUrl: `${dash}/stores/33333333-3333-4333-8333-333333333333/analytics`,
        currency: "EGP",
        visits: { current: 412, previous: 365 },
        orders: { current: 18, previous: 11 },
        sales: { current: 1_245_000, previous: 830_000 },
        topProducts: [
          { name: "عباية كتان", units: 7 },
          { name: "طرحة شيفون", units: 5 },
          { name: "حقيبة جلد", units: 3 },
        ],
      },
      {
        name: "Noor Home",
        analyticsUrl: `${dash}/stores/44444444-4444-4444-8444-444444444444/analytics`,
        currency: "SAR",
        visits: null,
        orders: { current: 0, previous: 2 },
        sales: { current: 0, previous: 45_000 },
        topProducts: [],
      },
    ],
  });
}
