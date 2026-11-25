import { defineApp } from "../manifest";

/**
 * F-110 (owner, 2026-11-26): hides the «صمم عبر منصة طلبي» credit from the
 * store's footer while installed (`store_app_installs`). $1 a month from the
 * store wallet; free while the seller's Pro plan is active (`freeWithPro`).
 * The storefront reads the install per store (apps/ecommerce
 * lib/store-site/remove-branding.server.ts); a lapsed install brings the credit back.
 */
export default defineApp({
  id: "remove_branding",
  slug: "remove-branding",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "إخفاء شارة طلبي", en: "Remove Tallaby badge" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "أخفِ عبارة «صمم عبر منصة طلبي» من أسفل متجرك.",
    en: "Hide \"Built with Tallaby\" from your store's footer.",
  },
  description: {
    ar: "بعد التثبيت تختفي عبارة «صمم عبر منصة طلبي» من أسفل كل صفحات متجرك، فيظهر متجرك باسمك فقط. يُخصم السعر من محفظتك كل شهر، ومجاني مع خطة Pro. إذا لم تكفِ المحفظة للتجديد تعود الشارة.",
    en: "Once installed, \"Built with Tallaby\" no longer shows at the bottom of your store's pages, so your store carries only your name. It's charged to your wallet every month, and free with Pro. If your wallet can't pay the renewal, the badge comes back.",
  },
  highlights: [
    { ar: "يخفي الشارة من أسفل كل الصفحات", en: "Hides the badge from every page's footer" },
    { ar: "لهذا المتجر فقط", en: "For this store only" },
    { ar: "مجاني مع خطة Pro", en: "Free with Pro" },
  ],
  keywords: ["remove branding", "white label", "powered by", "badge", "tallaby badge", "شارة"],
  icon: { background: "#E6F0F2", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "monthly", usdCents: 100 },
  freeWithPro: true,
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "toggle",
  settingsRoute: null,
  surfaces: ["storefront.footer"],
});
