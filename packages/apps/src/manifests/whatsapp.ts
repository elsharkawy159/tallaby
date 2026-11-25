import { defineApp } from "../manifest";

/**
 * F-109: order updates on WhatsApp from Tallaby's official number (docs/whatsapp.md).
 * Free for now (D3). The truth for "on" is `store_whatsapp_settings.enabled`
 * (0180), not `store_app_installs`: the App Center's install and remove write
 * that row (`setStoreWhatsAppEnabled`), and its installed state is read from it.
 */
export default defineApp({
  id: "whatsapp",
  slug: "whatsapp",
  kind: "app",
  category: "messaging",
  mechanism: "notifications",
  name: { ar: "إشعارات واتساب", en: "WhatsApp notifications" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "يرسل لعميلك تحديثات طلبه على واتساب من رقم طلبي الرسمي. مجاني حاليًا.",
    en: "Sends your customer order updates on WhatsApp from Tallaby's official number. Free for now.",
  },
  description: {
    ar: "اختر التحديثات التي تصل لعميلك على واتساب: استلام الطلب والتأكيد والشحن والتسليم والإلغاء. تصل الرسائل من رقم طلبي الرسمي وتذكر اسم متجرك، ويمكن للعميل تأكيد طلبه أو إلغاؤه بزر في الرسالة. تصل فقط للعملاء الذين وافقوا عند إتمام الطلب. مجاني حاليًا.",
    en: "Choose which updates your customer gets on WhatsApp: order received, confirmed, shipped, delivered and cancelled. Messages come from Tallaby's official number and name your store, and the customer can confirm or cancel the order with a button. Only customers who agreed at checkout get them. Free for now.",
  },
  highlights: [
    { ar: "من رقم طلبي الرسمي وباسم متجرك", en: "From Tallaby's official number, naming your store" },
    { ar: "العميل يؤكد طلبه أو يلغيه بزر", en: "Customers confirm or cancel with one button" },
    { ar: "مجاني حاليًا", en: "Free for now" },
  ],
  keywords: ["whatsapp", "notifications", "order updates", "messages"],
  icon: { background: "#25D366", foreground: "#FFFFFF", dark: true },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "toggle",
  settingsRoute: "whatsapp",
  surfaces: ["customer.messages", "orders", "storefront.checkout"],
});
