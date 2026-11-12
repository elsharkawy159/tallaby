import { defineApp } from "../manifest";

export default defineApp({
  id: "paylink",
  slug: "paylink",
  kind: "integration",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "باي لينك", en: "Paylink" },
  vendor: { ar: "Paylink", en: "Paylink" },
  summary: {
    ar: "الدفع الإلكتروني للأنشطة في السعودية، ويصل المبلغ إلى حسابك في باي لينك. قريبًا.",
    en: "Online payments for businesses in Saudi Arabia, paid to your own Paylink account. Coming soon.",
  },
  description: {
    ar: "الدفع الإلكتروني للأنشطة في السعودية، ويصل المبلغ إلى حسابك في باي لينك. قريبًا.",
    en: "Online payments for businesses in Saudi Arabia, paid to your own Paylink account. Coming soon.",
  },
  highlights: [],
  keywords: ["Paylink", "Saudi", "payment gateway"],
  icon: { background: "#2B4C9B", foreground: "#FFFFFF", dark: true },
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
