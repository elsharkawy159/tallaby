import { defineApp } from "../manifest";

/** F-11b: the store's product feed addresses for Meta, Google Merchant Center and TikTok. Always on; nothing is stored. */
export default defineApp({
  id: "product_feeds",
  slug: "product-feeds",
  kind: "app",
  category: "tracking",
  mechanism: "feed",
  name: { ar: "كتالوج المنتجات للإعلانات", en: "Product feeds" },
  vendor: { ar: "Meta · Google · TikTok", en: "Meta · Google · TikTok" },
  summary: {
    ar: "رابط بمنتجات متجرك تضيفه في Meta وGoogle Merchant Center وTikTok لإعلانات الكتالوج.",
    en: "A link to your store's products for Meta, Google Merchant Center and TikTok catalog ads.",
  },
  description: {
    ar: "كل متجر منشور له روابط كتالوج جاهزة بأسعار منتجاته وصورها ومخزونها. انسخ الرابط وأضفه في مدير الكتالوج عند المنصة، وهي تقرأ التحديثات وحدها.",
    en: "Every published store has ready feed links with its products' prices, photos and stock. Copy a link into the platform's catalog manager, and it picks up changes by itself.",
  },
  highlights: [
    { ar: "رابط لكل منصة ولكل لغة", en: "One link per platform and language" },
    { ar: "يتحدّث وحده مع منتجاتك", en: "Updates with your products by itself" },
  ],
  keywords: ["feed", "catalog", "Meta catalog", "Google Merchant Center", "TikTok catalog"],
  icon: { background: "#145163", foreground: "#FFFFFF", dark: true },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "product_feeds",
  surfaces: ["catalog.feed"],
});
