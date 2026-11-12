import { defineApp } from "../manifest";

export default defineApp({
  id: "paytabs",
  slug: "paytabs",
  kind: "integration",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "باي تابس", en: "PayTabs" },
  vendor: { ar: "PayTabs", en: "PayTabs" },
  summary: {
    ar: "الدفع بالبطاقة بأكثر من عملة، ويصل المبلغ مباشرة إلى حسابك في باي تابس. قريبًا.",
    en: "Card payments in several currencies, paid straight to your own PayTabs account. Coming soon.",
  },
  description: {
    ar: "الدفع بالبطاقة بأكثر من عملة، ويصل المبلغ مباشرة إلى حسابك في باي تابس. قريبًا.",
    en: "Card payments in several currencies, paid straight to your own PayTabs account. Coming soon.",
  },
  highlights: [],
  keywords: ["PayTabs", "card", "payment gateway"],
  icon: { background: "#1F3A5F", foreground: "#FFFFFF", dark: true },
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
