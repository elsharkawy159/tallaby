import { defineApp } from "../manifest";

/**
 * Downsell (ROADMAP.md F-116, owner 2026-11-27). On a store website's
 * checkout, a shopper about to leave without ordering sees one offer the
 * seller picked for a product in the cart: a cheaper product of the store, or
 * one of the store's coupons. On/off is the install (`store_app_installs`);
 * offers live in `product_downsells` (0185). Prices and discounts come from
 * the existing cart and coupon code.
 */
export default defineApp({
  id: "downsell",
  slug: "downsell",
  kind: "app",
  category: "marketing",
  mechanism: "widget",
  name: { ar: "عرض قبل المغادرة (Downsell)", en: "Downsell" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "إذا حاول العميل مغادرة صفحة الدفع دون طلب، اعرض عليه منتجًا أرخص أو كوبون خصم.",
    en: "When a shopper tries to leave checkout without ordering, offer a cheaper product or a coupon.",
  },
  description: {
    ar: "اختر لكل منتج عرضًا واحدًا: منتجًا أرخص من متجرك، أو أحد كوبوناتك. إذا حاول العميل مغادرة صفحة الدفع دون أن يطلب، يظهر له العرض مرة واحدة، فيستبدل المنتج أو يطبّق الكوبون بضغطة.",
    en: "Pick one offer per product: a cheaper product from your store, or one of your coupons. When a shopper tries to leave checkout without ordering, the offer shows once, and they swap the product or apply the coupon in one tap.",
  },
  highlights: [
    { ar: "يظهر مرة واحدة فقط لكل زيارة", en: "Shows only once per visit" },
    { ar: "منتج أرخص أو أحد كوبوناتك", en: "A cheaper product or one of your coupons" },
    { ar: "في صفحة الدفع على موقع متجرك", en: "On your store website's checkout" },
  ],
  keywords: ["downsell", "exit intent", "exit offer", "abandoned checkout", "coupon"],
  icon: { background: "#FCE4E1", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "toggle",
  settingsRoute: "downsell",
  surfaces: ["storefront.checkout"],
});
