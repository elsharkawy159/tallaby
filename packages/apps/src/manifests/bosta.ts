import { defineApp } from "../manifest";

/** BS-06, F-12: the seller's own Bosta API key (encrypted), a pickup location, and tracking webhooks. */
export default defineApp({
  id: "bosta",
  slug: "bosta",
  kind: "integration",
  category: "shipping",
  mechanism: "carrier",
  name: { ar: "بوسطة", en: "Bosta" },
  vendor: { ar: "Bosta", en: "Bosta" },
  summary: {
    ar: "أرسل طلبات متجرك إلى بوسطة بضغطة واحدة، أو تلقائيًا عند تأكيد الطلب. وتتحدّث حالة الشحنة وحدها.",
    en: "Send your store's orders to Bosta in one click, or automatically when you confirm them. Tracking updates come back by themselves.",
  },
  description: {
    ar: "اربط حسابك في بوسطة بمفتاح الـ API، واختر مكان الاستلام، وأرسل الطلبات إلى بوسطة من صفحة الطلبات أو تلقائيًا عند التأكيد. حالة الشحنة ترجع لطلبك وحدها. رسوم الشحن تدفعها لبوسطة على حسابك عندهم.",
    en: "Connect your Bosta account with its API key, pick your pickup location, and send orders to Bosta from the Orders page or automatically when you confirm them. Shipment updates come back to the order by themselves. You pay shipping fees to Bosta on your own account.",
  },
  highlights: [
    { ar: "شحنة بضغطة أو تلقائيًا عند التأكيد", en: "Ship in one click or on confirm" },
    { ar: "تحديثات التتبع ترجع وحدها", en: "Tracking updates come back by themselves" },
    { ar: "بوليصة الشحن جاهزة للطباعة", en: "Airway bills ready to print" },
  ],
  keywords: ["Bosta", "shipping", "courier", "delivery"],
  icon: { background: "#E30613", foreground: "#FFFFFF", image: "/app-logos/bosta.png" },
  screenshots: [],
  pricing: { model: "free" },
  providerFees: true,
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "bosta",
  surfaces: ["orders", "shipping"],
  docsUrl: "https://tallaby.com/integrations/bosta",
  internal: { provider: "bosta" },
});
