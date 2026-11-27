import { defineApp } from "../manifest";

/**
 * F-22 as an App Center app (owner, 2026-11-27, Marketing tools). Built in:
 * its settings stay in `stores.settings.salesPopup`, and the old
 * Store settings › Sales pop-up URL redirects to this app's settings.
 */
export default defineApp({
  id: "sales_popup",
  slug: "sales-popup",
  kind: "app",
  category: "marketing",
  mechanism: "widget",
  name: { ar: "إشعارات المبيعات (Sales pop-up)", en: "Sales pop-up" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "اعرض لزوار متجرك إشعارات بطلبات حديثة، فيشعروا بأن المتجر نشط وتزداد ثقتهم ورغبتهم في الشراء.",
    en: "Show your store's visitors small notes about recent orders, so they see an active store and buy with more trust.",
  },
  description: {
    ar: "اعرض لزوار متجرك إشعارات بطلبات حديثة، فيشعروا بأن المتجر نشط وتزداد ثقتهم ورغبتهم في الشراء. تظهر طلباتك الحقيقية فقط، دون أي اسم أو رقم هاتف.",
    en: "Show your store's visitors small notes about recent orders, so they see an active store and buy with more trust. Only your real orders show, with no name or phone number.",
  },
  highlights: [
    { ar: "طلباتك الحقيقية فقط", en: "Only your real orders" },
    { ar: "دون اسم أو رقم هاتف", en: "No name or phone number" },
    { ar: "تختار المدة بين كل إشعار", en: "You choose the time between notes" },
  ],
  keywords: ["sales popup", "social proof", "recent orders", "notifications", "fomo"],
  icon: { background: "#FDF1DC", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "sales_popup",
  surfaces: [],
});
