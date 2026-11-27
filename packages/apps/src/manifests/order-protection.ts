import { defineApp } from "../manifest";

/**
 * A feature with its own dashboard page, listed in the App Center too so
 * sellers find it there (owner, 2026-11-27). The page stays where it is; the
 * app screen says where it is and opens it (`settingsRoute: "feature_page"`).
 */
export default defineApp({
  id: "order_protection",
  slug: "order-protection",
  kind: "app",
  category: "orders",
  mechanism: "server",
  name: { ar: "حماية الطلبات", en: "Order protection" },
  vendor: { ar: "طلبي", en: "Tallaby" },
  summary: { ar: "قلّل الطلبات الوهمية: احظر أرقامًا، وحدّد عدد الطلبات، واطلب التأكيد على واتساب.", en: "Cut fake orders: block numbers, limit orders and ask for a WhatsApp confirmation." },
  description: { ar: "قلّل الطلبات الوهمية في متجرك. احظر أرقام هواتف من الطلب، وحدّد عدد الطلبات المسموح به من نفس الرقم أو الجهاز، واطلب من العميل تأكيد طلبه برسالة واتساب جاهزة، واستقبل الطلبات من الدول التي توصّل إليها فقط.", en: "Cut fake orders in your store. Block phone numbers from ordering, limit how many orders the same number or device can place, ask the customer to confirm with a ready WhatsApp message, and take orders only from the countries you deliver to." },
  highlights: [
    { ar: "قائمة أرقام محظورة", en: "A blocked numbers list" },
    { ar: "حد لعدد الطلبات", en: "A limit on orders" },
    { ar: "تأكيد الطلب على واتساب", en: "Order confirmation on WhatsApp" },
    { ar: "الطلبات من دولتك فقط", en: "Orders from your country only" },
  ],
  keywords: ["fake orders","fraud","block","blocklist","order protection","confirm orders","country","block countries"],
  icon: { background: "#FDE8E4", foreground: "#145163" },
  screenshots: [],
  pricing: { model: "free" },
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "builtin",
  settingsRoute: "feature_page",
  opens: "order_protection",
  surfaces: [],
});
