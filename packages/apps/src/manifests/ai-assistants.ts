import { defineApp } from "../manifest";

/** F-29: Claude, ChatGPT, Cursor … manage the store over MCP. Connections live in `agent_grants` (0133). */
export default defineApp({
  id: "ai_assistants",
  slug: "ai-assistants",
  kind: "app",
  category: "ai",
  mechanism: "agent",
  name: { ar: "مساعدو الذكاء الاصطناعي", en: "AI assistants" },
  vendor: { ar: "Claude · ChatGPT · Cursor", en: "Claude · ChatGPT · Cursor" },
  summary: {
    ar: "أدِر منتجاتك وطلباتك وموقعك أثناء حديثك مع Claude أو ChatGPT أو Cursor.",
    en: "Manage your products, orders and website by chatting with Claude, ChatGPT or Cursor.",
  },
  description: {
    ar: "اربط مساعد الذكاء الاصطناعي الذي تستخدمه بحسابك في طلبي، واطلب منه بكلامك أن يضيف منتجات أو يعدّل أسعارًا أو يراجع طلبات. المساعد لا يرى إلا المتاجر التي تسمح له بها، وتقدر تلغي الربط في أي وقت.",
    en: "Connect the AI assistant you already use to your Tallaby account and ask it, in your own words, to add products, change prices or check orders. It only sees the stores you allow, and you can disconnect it at any time.",
  },
  highlights: [
    { ar: "يضيف ويعدّل المنتجات بالعربي والإنجليزي", en: "Adds and edits products in Arabic and English" },
    { ar: "يسألك قبل أي تغيير كبير", en: "Asks you before any big change" },
    { ar: "تلغي الربط بضغطة واحدة", en: "Disconnect in one click" },
  ],
  keywords: ["AI", "MCP", "Claude", "ChatGPT", "Cursor"],
  icon: { background: "#1F1A2E", foreground: "#F4B860", dark: true },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "ai_assistants",
  surfaces: ["agent"],
});
