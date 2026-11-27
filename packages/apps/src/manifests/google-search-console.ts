import { defineApp } from "../manifest";

/**
 * Google Search Console (owner, 2026-11-27: moved out of Website › SEO). The
 * verification token stays in `stores.seo.googleSiteVerification`, so stores
 * that verified before keep it. Built in: nothing to install.
 */
export default defineApp({
  id: "google_search_console",
  slug: "google-search-console",
  kind: "integration",
  category: "tracking",
  mechanism: "script",
  name: { ar: "Google Search Console", en: "Google Search Console" },
  vendor: { ar: "Google", en: "Google" },
  summary: {
    ar: "اربط متجرك بـ Google Search Console وتابع ظهوره في بحث جوجل.",
    en: "Connect your store to Google Search Console and see how it shows up on Google.",
  },
  description: {
    ar: "الصق كود التحقق من Google Search Console، وبعدها أضف خريطة الموقع، فيعرف جوجل صفحات متجرك ومنتجاته الجديدة أسرع.",
    en: "Paste the verification code from Google Search Console, then submit your sitemap, so Google finds your new pages and products faster.",
  },
  highlights: [
    { ar: "تأكيد ملكية متجرك", en: "Prove you own your store" },
    { ar: "رابط خريطة الموقع جاهز", en: "Your sitemap link, ready to submit" },
  ],
  keywords: ["Google Search Console", "Search Console", "GSC", "SEO", "sitemap", "verification"],
  icon: { background: "#FFFFFF", foreground: "#4285F4" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "google_search_console",
  surfaces: ["storefront.script"],
});
