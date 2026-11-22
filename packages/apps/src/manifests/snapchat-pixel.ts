import { defineApp } from "../manifest";

/** F-103: a validated Pixel id rendered through a fixed script template on this store's host only (browser pixel, no Conversions API). */
export default defineApp({
  id: "snapchat_pixel",
  slug: "snapchat-pixel",
  kind: "integration",
  category: "tracking",
  mechanism: "script",
  name: { ar: "Snapchat Pixel", en: "Snapchat Pixel" },
  vendor: { ar: "Snap Inc.", en: "Snap Inc." },
  summary: { ar: "قِس نتائج إعلاناتك على Snapchat.", en: "Measure your Snapchat ads." },
  description: {
    ar: "الصق معرّف البكسل من Snapchat Events Manager، فيرسل متجرك الزيارات والإضافة للسلة وبدء الدفع والشراء إلى Snapchat لتقيس نتائج إعلاناتك.",
    en: "Paste your Pixel ID from Snapchat Events Manager, and your store sends visits, add-to-cart, checkout and purchases to Snapchat so you can measure your ads.",
  },
  highlights: [
    { ar: "أحداث الزيارة والسلة والشراء", en: "View, cart and purchase events" },
    { ar: "يعمل بعد موافقة الزائر", en: "Runs only after the visitor agrees" },
  ],
  keywords: ["Snapchat", "Snap", "pixel", "ads"],
  icon: { background: "#FFFC00", foreground: "#000000" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "identifier",
  surfaces: ["storefront.script"],
  internal: { provider: "snapchat_pixel" },
});
