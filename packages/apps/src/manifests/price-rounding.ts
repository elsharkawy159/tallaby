import { defineApp } from "../manifest";

/**
 * F-112 as an App Center app (owner, 2026-11-27, Marketing tools). Built in:
 * the rule stays in `stores.settings.priceRounding` and is still applied on
 * every price save; the card left Store settings › General, and the old
 * `/settings#price-rounding` link is not used anywhere.
 */
export default defineApp({
  id: "price_rounding",
  slug: "price-rounding",
  kind: "app",
  category: "marketing",
  mechanism: "server",
  name: { ar: "تقريب الأسعار", en: "Round prices" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "قرّب أسعار منتجاتك تلقائيًا لأرقام سهلة، مثل 1,213 تصبح 1,220.",
    en: "Round your product prices to easy numbers automatically, like 1,213 to 1,220.",
  },
  description: {
    ar: "قرّب أسعار منتجاتك تلقائيًا لأرقام سهلة، مثل 1,213 تصبح 1,220. اختر خطوة التقريب واتجاهه، ويمكنك وضع قاعدة مختلفة لكل نطاق سعر. يُطبَّق التقريب عند كل حفظ للسعر، ويمكنك تقريب أسعارك الحالية بعد معاينتها.",
    en: "Round your product prices to easy numbers automatically, like 1,213 to 1,220. Pick the step and the direction, with a different rule for each price range if you like. It applies every time a price is saved, and you can round your current prices after a preview.",
  },
  highlights: [
    { ar: "لأعلى أو لأسفل أو لأقرب رقم", en: "Up, down or to the nearest step" },
    { ar: "قاعدة لكل نطاق سعر", en: "A rule for each price range" },
    { ar: "يقرّب أسعارك الحالية بعد المعاينة", en: "Rounds your current prices after a preview" },
  ],
  keywords: ["round prices", "price rounding", "pricing", "charm pricing", "prices"],
  icon: { background: "#E6F4EA", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "price_rounding",
  surfaces: [],
});
