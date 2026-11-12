import { defineApp } from "../manifest";

export default defineApp({
  id: "tallaby_pay",
  slug: "tallaby-pay",
  kind: "app",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "طلبي باي", en: "Tallaby Pay" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "الدفع بالبطاقة بدون حساب بوابة خاص بك، وتصل الأموال إلى محفظة متجرك. قريبًا.",
    en: "Card payments with no gateway account of your own; the money goes to your store wallet. Coming soon.",
  },
  description: {
    ar: "الدفع بالبطاقة بدون حساب بوابة خاص بك، وتصل الأموال إلى محفظة متجرك. قريبًا.",
    en: "Card payments with no gateway account of your own; the money goes to your store wallet. Coming soon.",
  },
  highlights: [],
  keywords: ["Tallaby Pay", "card"],
  icon: { background: "#0A5C4F", foreground: "#FFFFFF", dark: true, image: "/logo/logo.png" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "coming_soon",
  installMode: "connect",
  settingsRoute: null,
  surfaces: ["storefront.checkout", "payments"],
});
