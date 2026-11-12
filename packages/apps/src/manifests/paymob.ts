import { defineApp } from "../manifest";

/** F-39: the seller's own Paymob account (keys encrypted); one card gateway per store. */
export default defineApp({
  id: "paymob",
  slug: "paymob",
  kind: "integration",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "باي موب", en: "Paymob" },
  vendor: { ar: "Paymob", en: "Paymob" },
  summary: {
    ar: "الدفع بالبطاقات وميزة والمحافظ الإلكترونية في متجرك، وتصل الأموال مباشرة إلى حساب باي موب الخاص بك.",
    en: "Card, Meeza and mobile wallet payments on your store, paid straight to your own Paymob account.",
  },
  description: {
    ar: "اربط حسابك في باي موب بمفاتيحه، ويقدر عملاؤك يدفعوا بالبطاقة أو ميزة أو المحفظة عند الطلب. الفلوس تروح لحسابك في باي موب مباشرة، وباي موب يأخذ رسومه منك هناك. متجر واحد يربط بوابة دفع واحدة.",
    en: "Connect your Paymob account with its keys, and your customers can pay by card, Meeza or mobile wallet at checkout. The money goes straight to your Paymob account, and Paymob takes its fees there. A store connects one card gateway.",
  },
  highlights: [
    { ar: "بطاقات وميزة ومحافظ", en: "Cards, Meeza and wallets" },
    { ar: "الفلوس لحسابك مباشرة", en: "Paid straight to your account" },
    { ar: "وضع تجربة قبل التشغيل", en: "Test mode before going live" },
  ],
  keywords: ["Paymob", "card", "Meeza", "wallet", "payment gateway"],
  icon: { background: "#1863DC", foreground: "#FFFFFF", image: "/app-logos/paymob.png" },
  screenshots: [],
  pricing: { model: "free" },
  providerFees: true,
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "gateway",
  surfaces: ["storefront.checkout", "payments"],
  docsUrl: "https://tallaby.com/integrations/paymob",
  internal: { provider: "paymob" },
});
