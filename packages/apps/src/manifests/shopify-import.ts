import { defineApp } from "../manifest";

/** P7-07: a Shopify Admin API token (encrypted) used for one product import. */
export default defineApp({
  id: "shopify_import",
  slug: "shopify-import",
  kind: "integration",
  category: "data",
  mechanism: "import",
  name: { ar: "الاستيراد من Shopify", en: "Shopify import" },
  vendor: { ar: "Shopify", en: "Shopify" },
  summary: { ar: "انسخ منتجاتك من متجر Shopify.", en: "Copy your products from a Shopify store." },
  description: {
    ar: "اربط متجرك في Shopify برمز وصول للقراءة، واختر قسم طلبي لكل نوع منتجات، وانسخ منتجاتك بصورها وأسعارها ومتغيراتها إلى هذا المتجر.",
    en: "Connect your Shopify store with a read-only access token, pick a Tallaby category for each product type, and copy your products with their photos, prices and variants into this store.",
  },
  highlights: [
    { ar: "الصور والأسعار والمتغيرات", en: "Photos, prices and variants" },
    { ar: "تختار القسم لكل نوع", en: "Pick a category for each type" },
  ],
  keywords: ["Shopify", "import", "migrate"],
  icon: { background: "#95BF47", foreground: "#FFFFFF" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "shopify_import",
  surfaces: ["catalog.import"],
  internal: { provider: "shopify_import" },
});
