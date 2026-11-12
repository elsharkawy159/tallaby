import { defineApp } from "../manifest";

/** P7-03: a validated Pixel id rendered through a fixed script template on this store's host only. */
export default defineApp({
  id: "meta_pixel",
  slug: "meta-pixel",
  kind: "integration",
  category: "tracking",
  mechanism: "script",
  name: { ar: "Meta Pixel", en: "Meta Pixel" },
  vendor: { ar: "Meta", en: "Meta" },
  summary: {
    ar: "قِس نتائج إعلاناتك على فيسبوك وإنستجرام وكوّن جماهير مخصصة.",
    en: "Measure your Facebook and Instagram ads and build audiences.",
  },
  description: {
    ar: "الصق معرّف البكسل من Meta Events Manager، ويبدأ متجرك يرسل الزيارات والإضافة للسلة والشراء إلى Meta. تختار الأحداث التي ترسلها، وتقدر توثّق نطاقك الخاص من نفس المكان.",
    en: "Paste your Pixel ID from Meta Events Manager and your store starts sending visits, add-to-cart and purchases to Meta. You choose which events go out, and you can verify your own domain from the same place.",
  },
  highlights: [
    { ar: "أحداث الزيارة والسلة والشراء", en: "View, cart and purchase events" },
    { ar: "تختار الأحداث التي ترسلها", en: "Pick which events are sent" },
    { ar: "توثيق النطاق لـ Meta", en: "Domain verification for Meta" },
  ],
  keywords: ["Meta", "Facebook", "Instagram", "pixel", "ads"],
  icon: { background: "#0866FF", foreground: "#FFFFFF" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "identifier",
  surfaces: ["storefront.script"],
  docsUrl: "https://tallaby.com/integrations/meta-pixel",
  internal: { provider: "meta_pixel" },
});
