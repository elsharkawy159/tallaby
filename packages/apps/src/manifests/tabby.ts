import { defineApp } from "../manifest";

export default defineApp({
  id: "tabby",
  slug: "tabby",
  kind: "integration",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "تابي", en: "Tabby" },
  vendor: { ar: "Tabby", en: "Tabby" },
  summary: {
    ar: "يدفع العميل بالتقسيط. للأنشطة في السعودية والإمارات، بحسابك الخاص في تابي. قريبًا.",
    en: "Customers pay in installments. For businesses in Saudi Arabia and the UAE, with your own Tabby account. Coming soon.",
  },
  description: {
    ar: "يدفع العميل بالتقسيط. للأنشطة في السعودية والإمارات، بحسابك الخاص في تابي. قريبًا.",
    en: "Customers pay in installments. For businesses in Saudi Arabia and the UAE, with your own Tabby account. Coming soon.",
  },
  highlights: [],
  keywords: ["Tabby", "installments", "BNPL"],
  icon: { background: "#3BFFC1", foreground: "#292929" },
  screenshots: [],
  pricing: { model: "free" },
  providerFees: true,
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "coming_soon",
  installMode: "connect",
  settingsRoute: null,
  surfaces: ["storefront.checkout", "payments"],
});
