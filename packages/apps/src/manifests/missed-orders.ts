import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "missed_orders",
  slug: "missed-orders",
  kind: "app",
  category: "orders",
  mechanism: "server",
  name: { ar: "طلبات لم تكتمل", en: "Missed orders" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "عملاء بدأوا الطلب ولم يكملوه. راسلهم على واتساب لتساعدهم على إكماله.", en: "Customers who started an order and did not finish. Message them on WhatsApp to help them finish." },
  description: { ar: "عملاء أضافوا عنوان الشحن في صفحة الدفع بمتجرك ولم يكملوا الطلب. راسلهم على واتساب أو اتصل بهم لمساعدتهم على إكماله. يختفي العميل من القائمة عندما يطلب، وبعد ٣٠ يومًا.", en: "Customers who added a shipping address on your store's checkout but didn't place the order. Message them on WhatsApp or call to help them finish. Each one leaves the list once they order, and after 30 days." },
  highlights: [
    { ar: "قائمة بمن لم يكمل الطلب", en: "A list of who did not finish" },
    { ar: "تواصل عبر واتساب أو اتصال", en: "Reach them on WhatsApp or by phone" },
    { ar: "تُحدَّث تلقائيًا", en: "Updates on its own" },
  ],
  keywords: ["abandoned checkout","abandoned cart","missed orders","recover"],
  icon: { background: "#FDF1DC", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "missed_orders",
  surfaces: [],
});
