import { defineApp } from "../manifest";

export default defineApp({
  id: "aramex",
  slug: "aramex",
  kind: "integration",
  category: "shipping",
  mechanism: "carrier",
  name: { ar: "أرامكس", en: "Aramex" },
  vendor: { ar: "Aramex", en: "Aramex" },
  summary: {
    ar: "اشحن بحساب أرامكس الخاص بك داخل مصر وخارجها. قريبًا.",
    en: "Ship with your own Aramex account, in Egypt and abroad. Coming soon.",
  },
  description: {
    ar: "اشحن بحساب أرامكس الخاص بك داخل مصر وخارجها. قريبًا.",
    en: "Ship with your own Aramex account, in Egypt and abroad. Coming soon.",
  },
  highlights: [],
  keywords: ["Aramex", "shipping"],
  icon: { background: "#DC291E", foreground: "#FFFFFF", image: "/app-logos/aramex.png" },
  screenshots: [],
  pricing: { model: "free" },
  providerFees: true,
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "coming_soon",
  installMode: "connect",
  settingsRoute: null,
  surfaces: ["orders", "shipping"],
});
