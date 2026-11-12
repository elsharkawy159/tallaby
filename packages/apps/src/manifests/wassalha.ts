import { defineApp } from "../manifest";

/** F-12c: no API; orders go out as Wassalha's Excel upload sheet. Public settings only, no secret. */
export default defineApp({
  id: "wassalha",
  slug: "wassalha",
  kind: "integration",
  category: "shipping",
  mechanism: "sheet",
  name: { ar: "وصّلها (البريد المصري)", en: "Wassalha (Egypt Post)" },
  vendor: { ar: "البريد المصري", en: "Egypt Post" },
  summary: {
    ar: "نزّل طلباتك بملف رفع وصّلها وارفعه على لوحة تحكم وصّلها. يصل لكل المحافظات.",
    en: "Download your orders as Wassalha's upload sheet and upload it on the Wassalha dashboard. Reaches every governorate.",
  },
  description: {
    ar: "احفظ بيانات حسابك في وصّلها مرة واحدة، وبعدها نزّل الطلبات المختارة بملف Excel جاهز بصيغة وصّلها، وارفعه على لوحة تحكمهم. رسوم الشحن تدفعها للبريد المصري.",
    en: "Save your Wassalha account details once, then download the orders you pick as an Excel sheet in Wassalha's format and upload it on their dashboard. You pay shipping fees to Egypt Post.",
  },
  highlights: [
    { ar: "ملف Excel بصيغة وصّلها", en: "An Excel sheet in Wassalha's format" },
    { ar: "يصل لكل المحافظات", en: "Reaches every governorate" },
  ],
  keywords: ["Wassalha", "Egypt Post", "shipping"],
  icon: { background: "#003F87", foreground: "#FFD100", dark: true, image: "/app-logos/egypt-post.png" },
  screenshots: [],
  pricing: { model: "free" },
  providerFees: true,
  plans: ["free", "pro"],
  developer: "tallaby",
  status: "live",
  installMode: "connect",
  settingsRoute: "wassalha",
  surfaces: ["orders.export", "shipping"],
  internal: { provider: "wassalha" },
});
