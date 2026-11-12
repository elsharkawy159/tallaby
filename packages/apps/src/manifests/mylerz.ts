import { defineApp } from "../manifest";

export default defineApp({
  id: "mylerz",
  slug: "mylerz",
  kind: "integration",
  category: "shipping",
  mechanism: "carrier",
  name: { ar: "مايلرز", en: "Mylerz" },
  vendor: { ar: "Mylerz", en: "Mylerz" },
  summary: {
    ar: "اشحن بحساب مايلرز الخاص بك، وتحديثات التتبع ترجع تلقائيًا. قريبًا.",
    en: "Ship with your own Mylerz account, with tracking updates coming back automatically. Coming soon.",
  },
  description: {
    ar: "اشحن بحساب مايلرز الخاص بك، وتحديثات التتبع ترجع تلقائيًا. قريبًا.",
    en: "Ship with your own Mylerz account, with tracking updates coming back automatically. Coming soon.",
  },
  highlights: [],
  keywords: ["Mylerz", "shipping"],
  icon: { background: "#1B2A6B", foreground: "#FFFFFF", dark: true, image: "/app-logos/mylerz.png" },
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
