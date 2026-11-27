import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "automatic_discounts",
  slug: "automatic-discounts",
  kind: "app",
  category: "marketing",
  mechanism: "server",
  name: { ar: "الخصومات التلقائية", en: "Automatic discounts" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "خصومات تُطبَّق وحدها في متجرك دون كود.", en: "Discounts that apply on their own in your store, with no code." },
  description: { ar: "خصومات تُطبَّق تلقائيًا في متجرك دون كود: نسبة على كل المنتجات أو على أقسام معينة، أو عرض بتاريخ انتهاء، أو اشترِ كذا واحصل على كذا.", en: "Discounts that apply on their own in your store, with no code: a percent off everything or some categories, a sale with an end date, or buy X get Y." },
  highlights: [
    { ar: "على كل المنتجات أو أقسام معينة", en: "On everything or on some categories" },
    { ar: "عرض بتاريخ انتهاء", en: "A sale with an end date" },
    { ar: "اشترِ كذا واحصل على كذا", en: "Buy X get Y" },
  ],
  keywords: ["automatic discounts","sale","bogo","buy x get y","free gift","offers"],
  icon: { background: "#FDF1DC", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "automatic_discounts",
  surfaces: [],
});
