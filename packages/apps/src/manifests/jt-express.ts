import { defineApp } from "../manifest";

export default defineApp({
  id: "jt_express",
  slug: "jt-express",
  kind: "integration",
  category: "shipping",
  mechanism: "carrier",
  name: { ar: "جي آند تي إكسبريس", en: "J&T Express" },
  vendor: { ar: "J&T Express Egypt", en: "J&T Express Egypt" },
  summary: {
    ar: "اشحن بحساب جي آند تي الخاص بك في كل مصر. قريبًا.",
    en: "Ship with your own J&T Express account across Egypt. Coming soon.",
  },
  description: {
    ar: "اشحن بحساب جي آند تي الخاص بك في كل مصر. قريبًا.",
    en: "Ship with your own J&T Express account across Egypt. Coming soon.",
  },
  highlights: [],
  keywords: ["J&T Express", "JT", "shipping"],
  icon: { background: "#D7000F", foreground: "#FFFFFF", image: "/app-logos/jt-express.png" },
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
