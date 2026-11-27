import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "catalog_share",
  slug: "catalog-share",
  kind: "app",
  category: "marketing",
  mechanism: "server",
  name: { ar: "كتالوج للمشاركة", en: "Shareable catalog" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "رابط لقائمة من منتجاتك بالأسعار وزر الطلب، ترسله عبر واتساب.", en: "A link to a list of your products with prices and order buttons, to send on WhatsApp." },
  description: { ar: "أنشئ رابطًا لقائمة من منتجاتك بالأسعار وزر الطلب، لترسله عبر واتساب أو تحفظه بصيغة PDF.", en: "Make a link to a list of your products with prices and order buttons, to send on WhatsApp or save as PDF." },
  highlights: [
    { ar: "تختار المنتجات التي تظهر", en: "You choose the products" },
    { ar: "رابط ترسله عبر واتساب", en: "A link to send on WhatsApp" },
    { ar: "صفحة للطباعة أو PDF", en: "A print page or PDF" },
  ],
  keywords: ["catalog","catalogue","pdf","whatsapp catalog","price list"],
  icon: { background: "#EAF6F8", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "catalog_share",
  surfaces: [],
});
