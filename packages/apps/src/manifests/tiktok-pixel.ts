import { defineApp } from "../manifest";

/** F-103: a validated Pixel id rendered through a fixed script template on this store's host only (browser pixel, no Events API). */
export default defineApp({
  id: "tiktok_pixel",
  slug: "tiktok-pixel",
  kind: "integration",
  category: "tracking",
  mechanism: "script",
  name: { ar: "TikTok Pixel", en: "TikTok Pixel" },
  vendor: { ar: "TikTok", en: "TikTok" },
  summary: { ar: "قِس نتائج إعلاناتك على TikTok.", en: "Measure your TikTok ads." },
  description: {
    ar: "الصق معرّف البكسل من TikTok Events Manager، فيرسل متجرك الزيارات والإضافة للسلة وبدء الدفع والشراء إلى TikTok لتقيس نتائج إعلاناتك.",
    en: "Paste your Pixel ID from TikTok Events Manager, and your store sends visits, add-to-cart, checkout and purchases to TikTok so you can measure your ads.",
  },
  highlights: [
    { ar: "أحداث الزيارة والسلة والشراء", en: "View, cart and purchase events" },
    { ar: "يعمل بعد موافقة الزائر", en: "Runs only after the visitor agrees" },
  ],
  keywords: ["TikTok", "pixel", "ads"],
  icon: { background: "#000000", foreground: "#FFFFFF", dark: true },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "identifier",
  surfaces: ["storefront.script"],
  internal: { provider: "tiktok_pixel" },
});
