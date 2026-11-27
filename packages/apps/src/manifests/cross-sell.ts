import { defineApp } from "../manifest";

/**
 * F-32 as an App Center app (owner, 2026-11-27, Marketing tools). Built in:
 * the store-wide switch is `stores.cross_sell_enabled` (0145, on by default)
 * and each offer is still set on its product (`product_cross_sells`).
 */
export default defineApp({
  id: "cross_sell",
  slug: "cross-sell",
  kind: "app",
  category: "marketing",
  mechanism: "widget",
  name: { ar: "المنتجات المكملة (Cross-selling)", en: "Cross-selling" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "اعرض منتجًا آخر بخصم تحت المنتج وفي السلة، فيزيد مبلغ الطلب.",
    en: "Offer another product at a discount under the product and in the cart, so orders grow.",
  },
  description: {
    ar: "اختر لكل منتج منتجًا يُشترى معه وخصمًا عليه. يظهر العرض تحت المنتج وفي السلة، ويُطبَّق الخصم فقط ما دام المنتجان في الطلب نفسه.",
    en: "For each product, pick one that goes with it and a discount on it. The offer shows under the product and in the cart, and the discount applies only while both are in the same order.",
  },
  highlights: [
    { ar: "عرض تحت المنتج وفي السلة", en: "An offer under the product and in the cart" },
    { ar: "تحدده لكل منتج من صفحة المنتج", en: "Set per product, on the product's page" },
    { ar: "تقرير بما باعه كل عرض", en: "A report of what each offer sold" },
  ],
  keywords: ["cross sell", "cross selling", "upsell", "bundle", "frequently bought together"],
  icon: { background: "#E3F1EA", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "cross_sell",
  surfaces: ["storefront.product_page", "storefront.checkout"],
});
