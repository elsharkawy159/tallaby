import { defineApp } from "../manifest";

/** F-62: not open yet; a seller requests it from its page. No SMS price exists yet (set with F-38). */
export default defineApp({
  id: "sms",
  slug: "sms",
  kind: "app",
  category: "messaging",
  mechanism: "notifications",
  name: { ar: "الرسائل النصية SMS", en: "SMS" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: {
    ar: "أرسل لعملائك رسائل نصية عن طلباتهم. غير متاحة بعد: اطلبها وسنفعّلها لمتجرك.",
    en: "Text your customers about their orders. Not available yet: request it and we'll turn it on for your store.",
  },
  description: {
    ar: "أرسل لعملائك رسائل نصية عن طلباتهم. غير متاحة بعد: اطلبها وسنفعّلها لمتجرك.",
    en: "Text your customers about their orders. Not available yet: request it and we'll turn it on for your store.",
  },
  highlights: [],
  keywords: ["SMS", "text messages"],
  icon: { background: "#FDAD28", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "coming_soon",
  installMode: "request",
  settingsRoute: null,
  surfaces: ["customer.messages"],
});
