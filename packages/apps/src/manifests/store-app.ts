import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "store_app",
  slug: "store-app",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "تطبيق متجرك", en: "Your store app" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "يثبّت عملاؤك موقع متجرك كتطبيق على الهاتف باسم متجرك وأيقونته.", en: "Customers install your store website as a phone app with your store's name and icon." },
  description: { ar: "يمكن لعملائك تثبيت موقع متجرك كتطبيق على الهاتف باسم متجرك وأيقونته، وفتحه من الشاشة الرئيسية دون متصفح.", en: "Customers can install your store website as a phone app with your store's name and icon, and open it from the home screen without a browser." },
  highlights: [
    { ar: "باسم متجرك وأيقونته", en: "Your store's name and icon" },
    { ar: "يفتح من الشاشة الرئيسية", en: "Opens from the home screen" },
    { ar: "دون متجر تطبيقات", en: "No app store needed" },
  ],
  keywords: ["mobile app","pwa","app","home screen","install"],
  icon: { background: "#EAF6F8", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "store_app",
  surfaces: [],
});
