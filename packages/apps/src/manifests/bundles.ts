import { defineApp } from "../manifest";

/**
 * Product bundles (ROADMAP.md F-07f; docs/plans/bundles.md §4): a feature with
 * its own place in the dashboard (the product edit page), listed in the App
 * Center so sellers find it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "bundles",
  slug: "bundles",
  kind: "app",
  category: "marketing",
  mechanism: "widget",
  name: { ar: "حزم المنتجات", en: "Product bundles" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "اجمع عدة منتجات في منتج واحد بسعر واحد.", en: "Sell several products together as one, at one price." },
  description: {
    ar: "اجمع عدة منتجات من متجرك في حزمة واحدة بسعر تحدده، مثل طقم أو هدية. مخزون الحزمة يأتي من منتجاتها، وعند كل طلب ينقص مخزون كل منتج فيها. تنشئ الحزمة من صفحة تعديل المنتج.",
    en: "Put several of your products in one bundle at a price you set, like a set or a gift box. The bundle's stock comes from its products, and each order takes stock from every product in it. You make a bundle on the product's edit page.",
  },
  highlights: [
    { ar: "سعر واحد لعدة منتجات", en: "One price for several products" },
    { ar: "المخزون يأتي من المنتجات", en: "Stock comes from the products" },
    { ar: "حتى 10 منتجات في الحزمة", en: "Up to 10 products in a bundle" },
  ],
  keywords: ["bundles", "bundle", "kit", "combo", "set", "package"],
  icon: { background: "#FDF0E1", foreground: "#8A4B0F" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "bundles",
  surfaces: [],
});
