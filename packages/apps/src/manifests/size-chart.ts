import { defineApp } from "../manifest";

/** F-92: "Find my size" on product pages. Installed through `store_app_installs`; charts live in `store_size_charts` (0169). */
export default defineApp({
  id: "size_chart",
  slug: "size-chart",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "جدول المقاسات", en: "Size chart" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "العميل يكتب طوله ووزنه أو طول قدمه في صفحة المنتج ويعرف المقاس المناسب ليه.",
    en: "Shoppers type their height, weight or foot length on the product page and see the size that fits them.",
  },
  description: {
    ar: "اعمل جدول مقاسات من قوالب جاهزة للملابس والبناطيل والأحذية والفساتين، وعدّل كل رقم، وطبّقه على منتجات أو أقسام. في صفحة المنتج يظهر زر «اعرف مقاسك» ويقترح المقاس المناسب للعميل، فتقل المرتجعات.",
    en: "Build size charts from ready templates for tops, pants, shoes and dresses, edit every number, and apply each chart to products or categories. Product pages get a \"Find my size\" button that suggests the right size, so fewer orders come back.",
  },
  highlights: [
    { ar: "زر «اعرف مقاسك» في صفحة المنتج", en: "A \"Find my size\" button on the product page" },
    { ar: "قوالب جاهزة تعدّل أرقامها", en: "Ready templates with numbers you can edit" },
    { ar: "طبّقه على منتجات أو أقسام كاملة", en: "Apply it to products or whole categories" },
  ],
  keywords: ["size chart", "size guide", "sizes"],
  icon: { background: "#FCE9D2", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "toggle",
  settingsRoute: "size_chart",
  surfaces: ["storefront.product_page"],
});
