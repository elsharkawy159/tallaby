import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "email_campaigns",
  slug: "email-campaigns",
  kind: "app",
  category: "marketing",
  mechanism: "server",
  name: { ar: "حملات البريد الإلكتروني", en: "Email campaigns" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "أرسل بريدًا إلكترونيًا من متجرك إلى عملائك والمشتركين.", en: "Send emails from your store to your customers and subscribers." },
  description: { ar: "أرسل بريدًا إلكترونيًا من متجرك إلى عملائك والمشتركين في النشرة: عرض أو منتجات جديدة أو أخبار. يصل البريد باسم متجرك وألوانه، ويتضمن كل بريد رابطًا لإلغاء الاشتراك.", en: "Send an email from your store to your customers and newsletter subscribers: a sale, new products or news. Emails go out under your store's name and colours, and every email has an unsubscribe link." },
  highlights: [
    { ar: "باسم متجرك وألوانه", en: "Your store's name and colours" },
    { ar: "معاينة أثناء الكتابة", en: "A preview as you type" },
    { ar: "بريد تلقائي لمن توقفوا عن الطلب", en: "An automatic email for customers who stopped ordering" },
  ],
  keywords: ["email campaigns","newsletter","email marketing","win-back"],
  icon: { background: "#E8EEFC", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "email_campaigns",
  surfaces: [],
});
