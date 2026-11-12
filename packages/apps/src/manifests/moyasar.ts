import { defineApp } from "../manifest";

export default defineApp({
  id: "moyasar",
  slug: "moyasar",
  kind: "integration",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "ميسر", en: "Moyasar" },
  vendor: { ar: "Moyasar", en: "Moyasar" },
  summary: {
    ar: "الدفع بالبطاقة للأنشطة المسجلة في السعودية، ويصل المبلغ إلى حسابك في ميسر. قريبًا.",
    en: "Card payments for businesses registered in Saudi Arabia, paid to your own Moyasar account. Coming soon.",
  },
  description: {
    ar: "الدفع بالبطاقة للأنشطة المسجلة في السعودية، ويصل المبلغ إلى حسابك في ميسر. قريبًا.",
    en: "Card payments for businesses registered in Saudi Arabia, paid to your own Moyasar account. Coming soon.",
  },
  highlights: [],
  keywords: ["Moyasar", "card", "Saudi", "payment gateway"],
  icon: { background: "#0E7C66", foreground: "#FFFFFF", dark: true },
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
