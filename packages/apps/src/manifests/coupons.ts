import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "coupons",
  slug: "coupons",
  kind: "app",
  category: "marketing",
  mechanism: "server",
  name: { ar: "كوبونات الخصم", en: "Coupons" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "أنشئ أكواد خصم يكتبها عملاؤك عند الدفع.", en: "Create discount codes your customers enter at checkout." },
  description: { ar: "أنشئ أكواد خصم يكتبها عملاؤك عند الدفع: نسبة أو مبلغ ثابت أو شحن مجاني. يمكنك أن تعرض الكوبون في نافذة تظهر لزوار متجرك أو في السلة.", en: "Create discount codes your customers enter at checkout: a percent, a fixed amount or free shipping. You can show a coupon in a pop-up to your store visitors or in the cart." },
  highlights: [
    { ar: "نسبة أو مبلغ ثابت أو شحن مجاني", en: "A percent, a fixed amount or free shipping" },
    { ar: "نافذة كوبون لزوار متجرك", en: "A coupon pop-up for your visitors" },
    { ar: "اعرض الكوبون في السلة", en: "Show the coupon in the cart" },
  ],
  keywords: ["coupons","discount code","promo code","voucher"],
  icon: { background: "#FDE8E4", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "coupons",
  surfaces: [],
});
