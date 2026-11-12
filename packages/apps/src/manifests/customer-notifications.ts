import { defineApp } from "../manifest";

/** F-63: customer order update emails. Off by default; after the USD switch, $0.01 per order through the install engine. */
export default defineApp({
  id: "customer_notifications",
  slug: "customer-notifications",
  kind: "app",
  category: "messaging",
  mechanism: "notifications",
  name: { ar: "إشعارات الطلبات", en: "Order notifications" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "يرسل لعميلك رسائل بريد عن طلبه باسم متجرك: الشحن والتسليم والإلغاء والاسترداد.",
    en: "Emails your customer about their order under your store's name: shipped, delivered, cancelled and refund.",
  },
  description: {
    ar: "يرسل لعميلك رسائل بريد عن طلبه باسم متجرك: الشحن والتسليم والإلغاء والاسترداد. رسالة تأكيد الطلب تصل لعملائك في كل الباقات، بهذا التطبيق أو بدونه. الرسائل النصية SMS قريبًا. بدون هذا التطبيق، لن تصل رسائل التحديث هذه إلى عملائك.",
    en: "Emails your customer about their order under your store's name: shipped, delivered, cancelled and refund. The order confirmation email goes out in every plan, with or without this app. SMS is coming later. Without this app, your customers don't get these update emails.",
  },
  highlights: [
    { ar: "رسائل الشحن والتسليم والإلغاء والاسترداد", en: "Shipped, delivered, cancelled and refund emails" },
    { ar: "باسم متجرك وشعاره", en: "Under your store's name and logo" },
  ],
  keywords: ["email", "notifications", "order updates"],
  icon: { background: "#145163", foreground: "#FFFFFF", dark: true },
  screenshots: [],
  pricing: { model: "per_order", usdCents: 1 },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "toggle",
  settingsRoute: null,
  surfaces: ["customer.messages", "orders"],
});
