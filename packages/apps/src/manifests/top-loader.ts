import { defineApp } from "../manifest";

/**
 * The storefront's top loading bar as an App Center app (owner, 2026-11-27).
 * Built in and on for every store: the settings live in
 * `stores.settings.topLoader` (`@workspace/lib/stores/top-loader`), and the
 * storefront shell reads them (off, or a custom colour; brand colour by default).
 */
export default defineApp({
  id: "top_loader",
  slug: "top-loader",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "شريط التحميل", en: "Top loader" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "شريط رفيع أعلى الصفحة يظهر وقت تحميل الصفحة التالية، بلون متجرك أو لون تختاره.",
    en: "A thin bar at the top of the page while the next page loads, in your brand colour or one you choose.",
  },
  description: {
    ar: "شريط رفيع أعلى الصفحة يظهر وقت تحميل الصفحة التالية، فيعرف الزائر أن الصفحة بتفتح. شغّال في كل متجر بلون متجرك، ويمكنك اختيار لون آخر أو إيقافه في أي وقت.",
    en: "A thin bar at the top of the page while the next page loads, so visitors know the page is opening. It's on in every store in your brand colour. You can pick another colour or turn it off any time.",
  },
  highlights: [
    { ar: "شغّال في كل متجر", en: "On for every store" },
    { ar: "بلون متجرك أو لون تختاره", en: "Your brand colour or one you choose" },
    { ar: "أوقفه في أي وقت", en: "Turn it off any time" },
  ],
  keywords: ["top loader", "progress bar", "loading bar", "nprogress"],
  icon: { background: "#E3F0F4", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "top_loader",
  surfaces: [],
});
