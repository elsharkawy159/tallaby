import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "languages",
  slug: "languages",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "تعدد اللغات", en: "Languages" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "اعرض متجرك بالعربية والإنجليزية، واختر لغته الأساسية.", en: "Show your store in Arabic and English, and pick its main language." },
  description: { ar: "اعرض متجرك بالعربية والإنجليزية ليصل إلى عملاء أكثر. تختار اللغة الأساسية للمتجر واللغات التي يظهر بها.", en: "Show your store in Arabic and English to reach more customers. You pick the store's main language and the languages it shows in." },
  highlights: [
    { ar: "العربية والإنجليزية", en: "Arabic and English" },
    { ar: "تختار اللغة الأساسية", en: "You pick the main language" },
  ],
  keywords: ["languages","multilingual","multi-language","english","arabic","translation"],
  icon: { background: "#E8EEFC", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "languages",
  surfaces: [],
});
