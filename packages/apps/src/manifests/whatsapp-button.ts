import { defineApp } from "../manifest";

/**
 * WhatsApp button (owner, 2026-11-27): a floating WhatsApp chat button on the
 * store website. Installed through `store_app_installs` (not on by default);
 * settings in `stores.settings.whatsappButton` (`@workspace/lib/stores/whatsapp-button`).
 * Unrelated to the `whatsapp` app (F-109 order messages).
 */
export default defineApp({
  id: "whatsapp_button",
  slug: "whatsapp-button",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "زر واتساب", en: "WhatsApp button" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "زر واتساب ثابت في أسفل موقع متجرك، العميل يدوس عليه ويكلمك على طول.",
    en: "A WhatsApp button fixed at the bottom of your store website, so shoppers can message you in one tap.",
  },
  description: {
    ar: "زر واتساب أخضر ثابت في ركن موقعك، يفتح محادثة مع رقم متجرك على طول. اختار مكانه يمين أو شمال، وحجمه، ويظهر على الكمبيوتر أو الموبايل أو الاتنين، واكتب رسالة جاهزة تظهر للعميل أول ما يفتح المحادثة.",
    en: "A green WhatsApp button fixed in a corner of your website that opens a chat with your store's number. Pick the right or left side, its size, and whether it shows on computers, phones or both, and add a ready message shoppers see when the chat opens.",
  },
  highlights: [
    { ar: "العميل يكلمك بضغطة واحدة", en: "Shoppers message you in one tap" },
    { ar: "يمين أو شمال، وبالحجم اللي تحبه", en: "Right or left, in the size you like" },
    { ar: "رسالة جاهزة تبدأ بيها المحادثة", en: "A ready message to start the chat" },
  ],
  keywords: ["whatsapp button", "chat button", "floating whatsapp", "واتساب"],
  icon: { background: "#25D366", foreground: "#FFFFFF", dark: true },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "toggle",
  settingsRoute: "whatsapp_button",
  surfaces: ["storefront.footer"],
});
