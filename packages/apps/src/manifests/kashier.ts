import { defineApp } from "../manifest";

/** F-39: the seller's own Kashier account (keys encrypted); one card gateway per store. */
export default defineApp({
  id: "kashier",
  slug: "kashier",
  kind: "integration",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "كاشير", en: "Kashier" },
  vendor: { ar: "Kashier", en: "Kashier" },
  summary: {
    ar: "الدفع بالبطاقات والمحافظ الإلكترونية في متجرك، وتصل الأموال مباشرة إلى حساب كاشير الخاص بك.",
    en: "Card and mobile wallet payments on your store, paid straight to your own Kashier account.",
  },
  description: {
    ar: "اربط حسابك في كاشير بمفاتيحه، ويقدر عملاؤك يدفعوا بالبطاقة أو المحفظة عند الطلب. الفلوس تروح لحسابك في كاشير مباشرة، وكاشير يأخذ رسومه منك هناك. متجر واحد يربط بوابة دفع واحدة.",
    en: "Connect your Kashier account with its keys, and your customers can pay by card or mobile wallet at checkout. The money goes straight to your Kashier account, and Kashier takes its fees there. A store connects one card gateway.",
  },
  highlights: [
    { ar: "بطاقات ومحافظ", en: "Cards and wallets" },
    { ar: "الفلوس لحسابك مباشرة", en: "Paid straight to your account" },
    { ar: "وضع تجربة قبل التشغيل", en: "Test mode before going live" },
  ],
  keywords: ["Kashier", "card", "wallet", "payment gateway"],
  icon: { background: "#5B2BE0", foreground: "#FFFFFF", image: "/app-logos/kashier.png" },
  screenshots: [],
  pricing: { model: "free" },
  providerFees: true,
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "gateway",
  surfaces: ["storefront.checkout", "payments"],
  docsUrl: "https://tallaby.com/integrations/kashier",
  internal: { provider: "kashier" },
});
