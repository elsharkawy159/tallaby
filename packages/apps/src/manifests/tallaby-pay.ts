import { defineApp } from "../manifest";

/**
 * F-100: Tallaby Pay. No account and no keys: the shopper pays on Tallaby's own
 * EasyKash account, Tallaby keeps its fee (3% by default, `billing_settings`),
 * and the rest goes to the store's Tallaby Pay earnings, never the store
 * wallet. One card gateway per store, listed first among the payment apps
 * (owner, 2026-11-18). Turning it on is refused while the `tallaby_pay_live`
 * switch is off.
 */
export default defineApp({
  id: "tallaby_pay",
  slug: "tallaby-pay",
  kind: "app",
  category: "payments",
  mechanism: "gateway",
  name: { ar: "طلبي باي", en: "Tallaby Pay" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "الدفع أونلاين بدون حساب بوابة. تصل الأموال إلى أرباح طلبي باي، وتسحبها إلى حسابك.",
    en: "Online payments with no gateway account. The money goes to your Tallaby Pay earnings and you withdraw it to your account.",
  },
  description: {
    ar: "شغّل طلبي باي بضغطة، بدون حساب أو مفاتيح، ويمكن لعملائك الدفع بالبطاقة أو المحفظة أو ميزة، أو نقدًا في فوري وأمان، أو بالتقسيط. تأخذ طلبي 3% من كل طلب مدفوع، وتشمل رسوم شركة الدفع، ويصل الباقي إلى أرباح طلبي باي الخاصة بمتجرك، منفصلة عن محفظة المتجر. يصبح المبلغ متاحًا عند توصيل الطلب، ثم تطلب سحبه إلى حسابك. كل متجر يربط بوابة دفع واحدة.",
    en: "Turn on Tallaby Pay in one step, with no account or keys, and your customers can pay by card, mobile wallet or Meeza, in cash at Fawry and Aman, or in instalments. Tallaby keeps 3% of each paid order, including the payment company's fee, and the rest goes to your store's Tallaby Pay earnings, kept apart from your store wallet. It becomes available once the order is delivered, and then you ask to withdraw it to your account. A store connects one card gateway.",
  },
  highlights: [
    { ar: "بدون حساب أو مفاتيح", en: "No account or keys" },
    { ar: "بطاقات ومحافظ وفوري وأمان", en: "Cards, wallets, Fawry and Aman" },
    { ar: "3% من كل طلب مدفوع", en: "3% of each paid order" },
    { ar: "تسحب أرباحك إلى حسابك", en: "Withdraw your earnings to your account" },
  ],
  keywords: ["Tallaby Pay", "card", "wallet", "Fawry", "Aman", "instalments", "payment gateway"],
  icon: { background: "#0A5C4F", foreground: "#FFFFFF", dark: true, image: "/logo/logo.png" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "gateway",
  surfaces: ["storefront.checkout", "payments"],
  internal: { provider: "tallaby_pay" },
});
