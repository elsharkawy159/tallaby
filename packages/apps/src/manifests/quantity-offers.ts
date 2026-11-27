import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "quantity_offers",
  slug: "quantity-offers",
  kind: "app",
  category: "marketing",
  mechanism: "widget",
  name: { ar: "عروض الكمية", en: "Quantity offers" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "اخفض السعر عندما يشتري العميل كمية أكبر من المنتج.", en: "Lower the price when a customer buys more of a product." },
  description: { ar: "اخفض السعر عندما يشتري العميل كمية أكبر، مثل قطعتين بخصم 10% و3 قطع بخصم 20%. يظهر العرض في صفحة المنتج، وتضيفه من صفحة تعديل كل منتج.", en: "Lower the price when a customer buys more, like 2 for 10% off and 3 for 20% off. The offer shows on the product page, and you add it on each product's edit page." },
  highlights: [
    { ar: "خصم أكبر لكل كمية", en: "A bigger discount for each quantity" },
    { ar: "يظهر في صفحة المنتج", en: "Shows on the product page" },
    { ar: "نسبة أو مبلغ للقطعة", en: "A percent or an amount per item" },
  ],
  keywords: ["quantity offers","bundles","volume discount","tiered pricing","upsell","bulk"],
  icon: { background: "#E6F4EA", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "quantity_offers",
  surfaces: [],
});
