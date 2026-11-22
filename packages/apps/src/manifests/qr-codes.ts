import { defineApp } from "../manifest";

export default defineApp({
  id: "qr_codes",
  slug: "qr-codes",
  kind: "app",
  category: "storefront",
  mechanism: "widget",
  name: { ar: "رموز QR", en: "QR codes" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "أنشئ رمز QR لمتجرك أو لإحدى صفحاته أو منتجاته.",
    en: "Create a QR code for your store, a page, or a product.",
  },
  description: {
    ar: "اختر الوجهة وحمّل الرمز كصورة. عند مسحه، يفتح الرابط مباشرة.",
    en: "Choose a destination and download the code as an image. Scanning it opens the link directly.",
  },
  highlights: [],
  keywords: ["qr code", "barcode", "print", "share", "كيو آر"],
  icon: { background: "#145163", foreground: "#FFFFFF", dark: true },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "qr_codes",
  surfaces: [],
});
