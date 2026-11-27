import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "shoppable_gallery",
  slug: "shoppable-gallery",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "صور قابلة للتسوق", en: "Shoppable photo" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "صورة كبيرة بعلامات، وبجانبها منتجات من متجرك بالسعر وزر الإضافة للسلة.", en: "A large photo with markers, and your store's products beside it with prices and an add-to-cart button." },
  description: { ar: "قسم تضيفه إلى موقعك من محرر الموقع: صورة كبيرة عليها علامات تحركها كما تريد، وبجانبها منتجات من متجرك بالصورة والاسم والسعر وزر الإضافة للسلة.", en: "A section you add to your website in the website editor: a large photo with markers you can move, and your store's products beside it with photo, name, price and an add-to-cart button." },
  highlights: [
    { ar: "تختار الصورة والمنتجات", en: "You choose the photo and the products" },
    { ar: "زر الإضافة للسلة", en: "An add-to-cart button" },
  ],
  keywords: ["shoppable","lookbook","hotspots","tagged photos","catalog photo","shop the look"],
  icon: { background: "#FDF1DC", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "shoppable_gallery",
  surfaces: [],
});
