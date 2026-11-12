import { defineApp } from "../manifest";

export default defineApp({
  id: "google_analytics",
  slug: "google-analytics",
  kind: "integration",
  category: "tracking",
  mechanism: "script",
  name: { ar: "Google Analytics 4", en: "Google Analytics 4" },
  vendor: { ar: "Google", en: "Google" },
  summary: {
    ar: "تابع زيارات متجرك ومبيعاته في Google Analytics.",
    en: "See your store's traffic and sales in Google Analytics.",
  },
  description: {
    ar: "الصق معرّف القياس (G-…) من حسابك في Google Analytics، وتظهر زيارات متجرك ومصادرها ومبيعاته هناك.",
    en: "Paste the measurement ID (G-…) from your Google Analytics account, and your store's visits, traffic sources and sales show up there.",
  },
  highlights: [
    { ar: "الزيارات ومصادرها", en: "Visits and where they come from" },
    { ar: "أحداث الشراء", en: "Purchase events" },
  ],
  keywords: ["Google Analytics", "GA4", "analytics"],
  icon: { background: "#F9AB00", foreground: "#FFFFFF" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "identifier",
  surfaces: ["storefront.script"],
  internal: { provider: "google_analytics" },
});
