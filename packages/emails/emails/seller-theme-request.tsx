import { SellerThemeRequestEmail } from "../src/index.js";
import { settingsUrl } from "./_fixtures.js";

export default function SellerThemeRequest() {
  return SellerThemeRequestEmail({
    locale: "ar",
    storeName: "متجر Tallaby",
    settingsUrl,
    status: "ready",
    reply: "أضفنا القالب باسم «نور» في قسم الأزياء.",
    summary: "قالب بسيط بألوان هادئة لمتجر ملابس",
    requestedAt: "6 نوفمبر 2026",
    links: { templates: "https://dashboard.tallaby.com/stores/1/website/templates" },
  });
}
