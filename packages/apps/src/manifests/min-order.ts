import { defineApp } from "../manifest";

/**
 * Minimum order (F-13b) listed in the App Center (owner, 2026-11-27, app A3:
 * "order rules"). The setting stays in Store settings › Checkout; free
 * shipping over an amount stays per delivery zone on the Shipping page.
 */
export default defineApp({
  id: "min_order",
  slug: "min-order",
  kind: "app",
  category: "orders",
  mechanism: "server",
  name: { ar: "الحد الأدنى للطلب", en: "Minimum order" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "لا يكمل العميل الطلب إلا عندما تبلغ منتجات السلة مبلغًا تحدده.",
    en: "Customers can place an order only when the products in the cart reach an amount you set.",
  },
  description: {
    ar: "لن يتمكن العميل في موقع متجرك من إكمال الطلب إلا عندما تبلغ المنتجات في السلة هذا المبلغ. لا يُحتسب الشحن والكوبونات ضمنه. ويمكنك أيضًا جعل الشحن مجانيًا فوق مبلغ معيّن لكل منطقة توصيل من صفحة الشحن.",
    en: "Customers on your store website can't place an order until the products in the cart add up to this amount. Shipping and coupons don't count toward it. You can also make delivery free above an amount for each delivery zone on the Shipping page.",
  },
  highlights: [
    { ar: "مبلغ تحدده أنت", en: "An amount you set" },
    { ar: "الشحن والكوبونات لا تُحتسب", en: "Shipping and coupons don't count" },
    { ar: "شحن مجاني فوق مبلغ لكل منطقة", en: "Free delivery above an amount, per zone" },
  ],
  keywords: ["minimum order", "min order", "free shipping", "order rules", "threshold"],
  icon: { background: "#E6F4EA", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "min_order",
  surfaces: [],
});
