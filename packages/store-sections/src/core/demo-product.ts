/**
 * A sample product for the editor's product page canvas (and the product page
 * template previews), used when the store has no product to show. Plain
 * Arabic strings: `ProductDetail` has no localized fields.
 */
import { stockPhoto } from "../designs/stock-photos";
import type { ProductDetail } from "./types";

export const DEMO_PRODUCT: ProductDetail = {
  id: "demo-product",
  slug: "demo-product",
  title: "سماعات لاسلكية برو",
  href: "/product",
  image: stockPhoto("electronics", 0),
  images: [stockPhoto("electronics", 0), stockPhoto("electronics", 1), stockPhoto("electronics", 2)],
  price: 900,
  compareAtPrice: 1200,
  discountPercent: 25,
  discountEndsAt: null,
  rating: 4.6,
  reviewCount: 128,
  inStock: true,
  quantity: 24,
  directCheckout: false,
  description: "سماعات لاسلكية بعزل ضوضاء فعّال وبطارية تدوم ٣٠ ساعة، مصممة لراحة الاستخدام اليومي.",
  contentHtml: null,
  bulletPoints: ["عزل ضوضاء فعّال", "بطارية تدوم ٣٠ ساعة", "اتصال بلوتوث ٥٫٣", "شحن سريع عبر USB-C"],
  variants: [
    { id: "demo-variant-black", label: "أسود", color: "#111111", image: stockPhoto("electronics", 0), price: 900, compareAtPrice: 1200, quantity: 12 },
    { id: "demo-variant-white", label: "أبيض", color: "#f4f4f4", image: stockPhoto("electronics", 1), price: 950, compareAtPrice: 1250, quantity: 12 },
  ],
  brand: "سونيك",
  category: { id: "demo-category", name: "سماعات" },
  seller: { name: "متجر التقنية", rating: 4.8, ratingCount: 342, freeDelivery: true },
};
