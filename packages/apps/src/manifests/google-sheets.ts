import { defineApp } from "../manifest";

/** P7-06: Google OAuth (refresh token encrypted), orders exported to the seller's own sheet. */
export default defineApp({
  id: "google_sheets",
  slug: "google-sheets",
  kind: "integration",
  category: "data",
  mechanism: "account",
  name: { ar: "Google Sheets", en: "Google Sheets" },
  vendor: { ar: "Google", en: "Google" },
  summary: { ar: "صدّر طلباتك إلى جدول بيانات.", en: "Export your orders to a spreadsheet." },
  description: {
    ar: "اربط حسابك في Google، وأنشئ جدول بيانات لمتجرك، وصدّر طلباتك إليه بضغطة. الجدول يتحدّث كل يوم، وطلبي لا يرى إلا الملفات التي ينشئها.",
    en: "Connect your Google account, create a sheet for your store, and export your orders to it in one click. The sheet updates every day, and Tallaby only sees the files it creates.",
  },
  highlights: [
    { ar: "تصدير الطلبات بضغطة", en: "Export orders in one click" },
    { ar: "تحديث يومي", en: "Updates every day" },
  ],
  keywords: ["Google Sheets", "spreadsheet", "export", "Excel"],
  icon: { background: "#0F9D58", foreground: "#FFFFFF" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "google_sheets",
  surfaces: ["orders.export"],
  internal: { provider: "google_sheets" },
});
